-- Update generate_time_slots_for_availability to check calendar conflicts
-- This prevents generating slots that overlap with external calendar events
CREATE OR REPLACE FUNCTION public.generate_time_slots_for_availability(
  p_lawyer_id uuid,
  p_date date,
  p_start time without time zone,
  p_end time without time zone,
  p_slot_minutes integer DEFAULT 60
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tz text;
  start_ts timestamptz;
  end_ts timestamptz;
  curr_start timestamptz;
  curr_end timestamptz;
  y int := EXTRACT(YEAR FROM p_date)::int;
  m int := EXTRACT(MONTH FROM p_date)::int;
  d int := EXTRACT(DAY FROM p_date)::int;
  sh int := EXTRACT(HOUR FROM p_start)::int;
  sm int := EXTRACT(MINUTE FROM p_start)::int;
  eh int := EXTRACT(HOUR FROM p_end)::int;
  em int := EXTRACT(MINUTE FROM p_end)::int;
  v_has_conflict BOOLEAN;
BEGIN
  -- Determine lawyer timezone, default to America/New_York
  SELECT COALESCE(lp.timezone, 'America/New_York') INTO tz
  FROM public.lawyer_profiles lp
  WHERE lp.id = p_lawyer_id
  LIMIT 1;

  -- Build UTC timestamps out of local date/time in the lawyer's timezone
  start_ts := make_timestamptz(y, m, d, sh, sm, 0, tz);
  end_ts   := make_timestamptz(y, m, d, eh, em, 0, tz);

  IF end_ts <= start_ts THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  curr_start := start_ts;
  LOOP
    curr_end := curr_start + make_interval(mins => p_slot_minutes);
    EXIT WHEN curr_end > end_ts; -- only generate full slots

    -- Check for calendar conflicts before creating slot
    SELECT public.check_calendar_conflicts(
      p_lawyer_id,
      curr_start,
      curr_end
    ) INTO v_has_conflict;

    -- Only create slot if there's no conflict
    IF NOT v_has_conflict THEN
      INSERT INTO public.time_slots (lawyer_id, start_time, end_time, is_booked)
      VALUES (p_lawyer_id, curr_start, curr_end, false)
      ON CONFLICT (lawyer_id, start_time, end_time) DO NOTHING;
    END IF;

    curr_start := curr_start + make_interval(mins => p_slot_minutes);
  END LOOP;
END;
$$;

-- Also add a function to regenerate slots for a lawyer, excluding conflicts
-- This can be called after calendar sync to update available slots
CREATE OR REPLACE FUNCTION public.regenerate_slots_excluding_conflicts(
  p_lawyer_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Delete unbooked slots that now have conflicts
  DELETE FROM public.time_slots ts
  WHERE ts.lawyer_id = p_lawyer_id
    AND ts.is_booked = false
    AND public.check_calendar_conflicts(
      p_lawyer_id,
      ts.start_time,
      ts.end_time
    ) = true;

  -- Regenerate slots for existing availability blocks
  -- This will skip slots that conflict with calendar events
  FOR rec IN (
    SELECT availability_date, start_time, end_time
    FROM public.lawyer_date_availability
    WHERE lawyer_id = p_lawyer_id
      AND availability_date >= CURRENT_DATE
  ) LOOP
    PERFORM public.generate_time_slots_for_availability(
      p_lawyer_id,
      rec.availability_date,
      rec.start_time,
      rec.end_time,
      60
    );
  END LOOP;
END;
$$;

