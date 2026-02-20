-- Improve regenerate_slots_excluding_conflicts to return count of removed slots
-- This allows UI to show feedback when slots are removed after calendar sync

-- Drop the existing function first (cannot change return type with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.regenerate_slots_excluding_conflicts(uuid);

CREATE FUNCTION public.regenerate_slots_excluding_conflicts(
  p_lawyer_id uuid
)
RETURNS TABLE(slots_removed integer, slots_added integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slots_removed integer := 0;
  v_slots_added integer := 0;
  rec RECORD;
BEGIN
  -- Count and delete unbooked slots that now have conflicts
  WITH deleted AS (
    DELETE FROM public.time_slots ts
    WHERE ts.lawyer_id = p_lawyer_id
      AND ts.is_booked = false
      AND public.check_calendar_conflicts(
        p_lawyer_id,
        ts.start_time,
        ts.end_time
      ) = true
    RETURNING ts.id
  )
  SELECT COUNT(*) INTO v_slots_removed FROM deleted;

  -- Regenerate slots for existing availability blocks
  -- This will skip slots that conflict with calendar events
  FOR rec IN (
    SELECT availability_date, start_time, end_time
    FROM public.lawyer_date_availability
    WHERE lawyer_id = p_lawyer_id
      AND availability_date >= CURRENT_DATE
  ) LOOP
    -- Count existing slots before regeneration for this availability date
    DECLARE
      before_count integer;
      after_count integer;
      tz text;
    BEGIN
      -- Get lawyer timezone for date conversion
      SELECT COALESCE(lp.timezone, 'America/New_York') INTO tz
      FROM public.lawyer_profiles lp
      WHERE lp.id = p_lawyer_id
      LIMIT 1;

      -- Count existing slots for this date
      SELECT COUNT(*) INTO before_count
      FROM public.time_slots
      WHERE lawyer_id = p_lawyer_id
        AND DATE(start_time AT TIME ZONE tz) = rec.availability_date
        AND is_booked = false;

      PERFORM public.generate_time_slots_for_availability(
        p_lawyer_id,
        rec.availability_date,
        rec.start_time,
        rec.end_time,
        60
      );

      -- Count slots after regeneration for this date
      SELECT COUNT(*) INTO after_count
      FROM public.time_slots
      WHERE lawyer_id = p_lawyer_id
        AND DATE(start_time AT TIME ZONE tz) = rec.availability_date
        AND is_booked = false;

      -- Only count net new slots (after - before) to avoid double counting
      IF after_count > before_count THEN
        v_slots_added := v_slots_added + (after_count - before_count);
      END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT v_slots_removed, v_slots_added;
END;
$$;

COMMENT ON FUNCTION public.regenerate_slots_excluding_conflicts(uuid) IS 
'Regenerates time slots for a lawyer, removing slots that conflict with calendar events and adding new slots for availability blocks. Returns the count of slots removed and added.';

