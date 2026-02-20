-- Create unique index to prevent duplicate slots for the same lawyer/time range
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_slots_unique
ON public.time_slots (lawyer_id, start_time, end_time);

-- Helpful index for client queries
CREATE INDEX IF NOT EXISTS idx_time_slots_lawyer_day
ON public.time_slots (lawyer_id, is_booked, start_time);

-- Function: generate time slots for a given availability block
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

    INSERT INTO public.time_slots (lawyer_id, start_time, end_time, is_booked)
    VALUES (p_lawyer_id, curr_start, curr_end, false)
    ON CONFLICT (lawyer_id, start_time, end_time) DO NOTHING;

    curr_start := curr_start + make_interval(mins => p_slot_minutes);
  END LOOP;
END;
$$;

-- Trigger function: after insert on lawyer_date_availability
CREATE OR REPLACE FUNCTION public.tg_after_insert_lawyer_date_availability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.generate_time_slots_for_availability(
    NEW.lawyer_id,
    NEW.availability_date,
    NEW.start_time,
    NEW.end_time,
    60
  );
  RETURN NEW;
END;
$$;

-- Trigger function: after delete on lawyer_date_availability to clean up unbooked time slots
CREATE OR REPLACE FUNCTION public.tg_after_delete_lawyer_date_availability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tz text;
  start_ts timestamptz;
  end_ts timestamptz;
  y int := EXTRACT(YEAR FROM OLD.availability_date)::int;
  m int := EXTRACT(MONTH FROM OLD.availability_date)::int;
  d int := EXTRACT(DAY FROM OLD.availability_date)::int;
  sh int := EXTRACT(HOUR FROM OLD.start_time)::int;
  sm int := EXTRACT(MINUTE FROM OLD.start_time)::int;
  eh int := EXTRACT(HOUR FROM OLD.end_time)::int;
  em int := EXTRACT(MINUTE FROM OLD.end_time)::int;
BEGIN
  SELECT COALESCE(lp.timezone, 'America/New_York') INTO tz
  FROM public.lawyer_profiles lp
  WHERE lp.id = OLD.lawyer_id
  LIMIT 1;

  start_ts := make_timestamptz(y, m, d, sh, sm, 0, tz);
  end_ts   := make_timestamptz(y, m, d, eh, em, 0, tz);

  DELETE FROM public.time_slots ts
  WHERE ts.lawyer_id = OLD.lawyer_id
    AND ts.start_time >= start_ts
    AND ts.end_time <= end_ts
    AND ts.is_booked = false;

  RETURN OLD;
END;
$$;

-- Trigger function: after update to regenerate (simple approach: delete unbooked within old range, then create for new range)
CREATE OR REPLACE FUNCTION public.tg_after_update_lawyer_date_availability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tz_old text;
  tz_new text;
  start_old timestamptz;
  end_old timestamptz;
BEGIN
  -- Clean up old range
  SELECT COALESCE(lp.timezone, 'America/New_York') INTO tz_old
  FROM public.lawyer_profiles lp
  WHERE lp.id = OLD.lawyer_id
  LIMIT 1;

  start_old := make_timestamptz(
    EXTRACT(YEAR FROM OLD.availability_date)::int,
    EXTRACT(MONTH FROM OLD.availability_date)::int,
    EXTRACT(DAY FROM OLD.availability_date)::int,
    EXTRACT(HOUR FROM OLD.start_time)::int,
    EXTRACT(MINUTE FROM OLD.start_time)::int,
    0,
    tz_old
  );
  end_old := make_timestamptz(
    EXTRACT(YEAR FROM OLD.availability_date)::int,
    EXTRACT(MONTH FROM OLD.availability_date)::int,
    EXTRACT(DAY FROM OLD.availability_date)::int,
    EXTRACT(HOUR FROM OLD.end_time)::int,
    EXTRACT(MINUTE FROM OLD.end_time)::int,
    0,
    tz_old
  );

  DELETE FROM public.time_slots ts
  WHERE ts.lawyer_id = OLD.lawyer_id
    AND ts.start_time >= start_old
    AND ts.end_time <= end_old
    AND ts.is_booked = false;

  -- Generate for new range
  PERFORM public.generate_time_slots_for_availability(
    NEW.lawyer_id,
    NEW.availability_date,
    NEW.start_time,
    NEW.end_time,
    60
  );

  RETURN NEW;
END;
$$;

-- Create triggers (drop first if they already exist to avoid duplicates)
DROP TRIGGER IF EXISTS trg_after_insert_lawyer_date_availability ON public.lawyer_date_availability;
CREATE TRIGGER trg_after_insert_lawyer_date_availability
AFTER INSERT ON public.lawyer_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.tg_after_insert_lawyer_date_availability();

DROP TRIGGER IF EXISTS trg_after_delete_lawyer_date_availability ON public.lawyer_date_availability;
CREATE TRIGGER trg_after_delete_lawyer_date_availability
AFTER DELETE ON public.lawyer_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.tg_after_delete_lawyer_date_availability();

DROP TRIGGER IF EXISTS trg_after_update_lawyer_date_availability ON public.lawyer_date_availability;
CREATE TRIGGER trg_after_update_lawyer_date_availability
AFTER UPDATE ON public.lawyer_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.tg_after_update_lawyer_date_availability();

-- Backfill: generate time slots for existing availability blocks
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT lawyer_id, availability_date, start_time, end_time
    FROM public.lawyer_date_availability
  ) LOOP
    PERFORM public.generate_time_slots_for_availability(
      rec.lawyer_id,
      rec.availability_date,
      rec.start_time,
      rec.end_time,
      60
    );
  END LOOP;
END $$;