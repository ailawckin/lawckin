-- Add per-lawyer slot duration and allow multiple weekly blocks per day

-- Slot duration setting on lawyer profile
ALTER TABLE public.lawyer_profiles
  ADD COLUMN IF NOT EXISTS slot_duration_minutes integer NOT NULL DEFAULT 30;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lawyer_profiles_slot_duration_check'
  ) THEN
    ALTER TABLE public.lawyer_profiles
      ADD CONSTRAINT lawyer_profiles_slot_duration_check
      CHECK (slot_duration_minutes IN (30, 60));
  END IF;
END $$;

-- Allow multiple weekly blocks per day
ALTER TABLE public.lawyer_weekly_availability
  DROP CONSTRAINT IF EXISTS lawyer_weekly_availability_unique;

CREATE INDEX IF NOT EXISTS idx_lawyer_weekly_availability_day
  ON public.lawyer_weekly_availability (lawyer_id, day_of_week);

-- Update time slot generation to use per-lawyer slot duration
CREATE OR REPLACE FUNCTION public.generate_time_slots_for_availability(
  p_lawyer_id uuid,
  p_date date,
  p_start time without time zone,
  p_end time without time zone,
  p_slot_minutes integer DEFAULT NULL
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
  v_has_conflict boolean;
  v_slot_minutes integer;
BEGIN
  -- Determine lawyer timezone and slot duration
  SELECT COALESCE(lp.timezone, 'America/New_York'), COALESCE(lp.slot_duration_minutes, 30)
  INTO tz, v_slot_minutes
  FROM public.lawyer_profiles lp
  WHERE lp.id = p_lawyer_id
  LIMIT 1;

  v_slot_minutes := COALESCE(p_slot_minutes, v_slot_minutes, 30);

  IF v_slot_minutes <= 0 THEN
    RAISE EXCEPTION 'Slot duration must be positive';
  END IF;

  -- Build UTC timestamps out of local date/time in the lawyer's timezone
  start_ts := make_timestamptz(y, m, d, sh, sm, 0, tz);
  end_ts   := make_timestamptz(y, m, d, eh, em, 0, tz);

  IF end_ts <= start_ts THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  curr_start := start_ts;
  LOOP
    curr_end := curr_start + make_interval(mins => v_slot_minutes);
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

    curr_start := curr_start + make_interval(mins => v_slot_minutes);
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
    NULL
  );
  RETURN NEW;
END;
$$;

-- Trigger function: after update to regenerate (simple approach: delete unbooked within old range, then create for new range)
CREATE OR REPLACE FUNCTION public.tg_after_update_lawyer_date_availability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tz_old text;
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
    NULL
  );

  RETURN NEW;
END;
$$;

-- Regenerate slots after calendar sync using per-lawyer slot duration
CREATE OR REPLACE FUNCTION public.regenerate_slots_excluding_conflicts(
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
  v_slot_minutes integer;
BEGIN
  SELECT COALESCE(lp.slot_duration_minutes, 30) INTO v_slot_minutes
  FROM public.lawyer_profiles lp
  WHERE lp.id = p_lawyer_id
  LIMIT 1;

  v_slot_minutes := COALESCE(v_slot_minutes, 30);

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
        v_slot_minutes
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

-- Rebuild unbooked slots for a lawyer (used when slot duration changes)
CREATE OR REPLACE FUNCTION public.rebuild_time_slots_for_lawyer(
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
  DELETE FROM public.time_slots ts
  WHERE ts.lawyer_id = p_lawyer_id
    AND ts.is_booked = false;

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
      NULL
    );
  END LOOP;
END;
$$;

-- Update lawyer list/search functions to include slot_duration_minutes
DROP FUNCTION IF EXISTS public.get_lawyers_list();

CREATE FUNCTION public.get_lawyers_list()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  specialty text,
  location text,
  practice_areas text[],
  ny_locations text[],
  experience_years integer,
  rating numeric,
  total_reviews integer,
  full_name text,
  avatar_url text,
  hourly_rate numeric,
  slot_duration_minutes integer,
  firm_name text
) AS $$
  SELECT
    lp.id,
    lp.user_id,
    COALESCE(NULLIF(lp.specialty, ''), (lp.practice_areas)[1]) as specialty,
    COALESCE(NULLIF(lp.location, ''), (lp.ny_locations)[1]) as location,
    lp.practice_areas,
    lp.ny_locations,
    lp.experience_years,
    lp.rating,
    lp.total_reviews,
    p.full_name,
    p.avatar_url,
    lp.hourly_rate,
    lp.slot_duration_minutes,
    f.firm_name
  FROM public.lawyer_profiles lp
  JOIN public.profiles p ON p.user_id = lp.user_id
  LEFT JOIN public.firms f ON f.id = lp.firm_id
  WHERE COALESCE(lp.verified, false) = true
    AND COALESCE(lp.status, 'active') = 'active'
  ORDER BY lp.rating DESC NULLS LAST
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS public.search_lawyers(
  p_practice_area TEXT,
  p_location TEXT,
  p_min_rate NUMERIC,
  p_max_rate NUMERIC,
  p_specific_issue TEXT,
  p_languages TEXT[],
  p_limit INTEGER
);

CREATE FUNCTION public.search_lawyers(
  p_practice_area TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_min_rate NUMERIC DEFAULT NULL,
  p_max_rate NUMERIC DEFAULT NULL,
  p_specific_issue TEXT DEFAULT NULL,
  p_languages TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  specialty text,
  location text,
  practice_areas text[],
  ny_locations text[],
  experience_years integer,
  rating numeric,
  total_reviews integer,
  full_name text,
  avatar_url text,
  hourly_rate numeric,
  slot_duration_minutes integer,
  firm_name text,
  match_score integer,
  specializations jsonb,
  expertise_areas jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH lawyer_data AS (
    SELECT
      lp.id,
      lp.user_id,
      COALESCE(NULLIF(lp.specialty, ''), (lp.practice_areas)[1]) as specialty,
      COALESCE(NULLIF(lp.location, ''), (lp.ny_locations)[1]) as location,
      lp.practice_areas,
      lp.ny_locations,
      lp.experience_years,
      lp.rating,
      lp.total_reviews,
      p.full_name,
      p.avatar_url,
      lp.hourly_rate,
      lp.slot_duration_minutes,
      f.firm_name,
      lp.specific_issues,
      lp.languages,
      -- Aggregate specializations
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'name', pas.specialization_name,
            'years', ls.years_experience
          )
        ) FILTER (WHERE pas.id IS NOT NULL),
        '[]'::jsonb
      ) as all_specializations,
      -- Aggregate expertise areas
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'area', pa.name,
            'years', le.years_experience
          )
        ) FILTER (WHERE pa.id IS NOT NULL),
        '[]'::jsonb
      ) as all_expertise
    FROM public.lawyer_profiles lp
    JOIN public.profiles p ON p.user_id = lp.user_id
    LEFT JOIN public.firms f ON f.id = lp.firm_id
    LEFT JOIN public.lawyer_specializations ls ON ls.lawyer_id = lp.id
    LEFT JOIN public.practice_area_specializations pas ON pas.id = ls.specialization_id
    LEFT JOIN public.lawyer_expertise le ON le.lawyer_id = lp.id
    LEFT JOIN public.practice_areas pa ON pa.id = le.practice_area_id
    WHERE COALESCE(lp.verified, false) = true
      AND COALESCE(lp.status, 'active') = 'active'
    GROUP BY lp.id, p.full_name, p.avatar_url, f.firm_name
  )
  SELECT
    ld.id,
    ld.user_id,
    ld.specialty,
    ld.location,
    ld.practice_areas,
    ld.ny_locations,
    ld.experience_years,
    ld.rating,
    ld.total_reviews,
    ld.full_name,
    ld.avatar_url,
    ld.hourly_rate,
    ld.slot_duration_minutes,
    ld.firm_name,
    (
      CASE WHEN p_practice_area IS NULL OR p_practice_area = '' THEN 0
        ELSE CASE WHEN ld.practice_areas @> ARRAY[p_practice_area]::text[] THEN 30 ELSE 0 END
      END
      +
      CASE WHEN p_location IS NULL OR p_location = '' THEN 0
        ELSE CASE WHEN ld.ny_locations @> ARRAY[p_location]::text[] THEN 25 ELSE 0 END
      END
      +
      CASE WHEN p_specific_issue IS NULL OR p_specific_issue = '' THEN 0
        ELSE CASE WHEN ld.specific_issues ? p_specific_issue THEN 20 ELSE 0 END
      END
      +
      CASE WHEN p_languages IS NULL OR array_length(p_languages, 1) IS NULL THEN 0
        ELSE CASE WHEN ld.languages && p_languages THEN 15 ELSE 0 END
      END
    )::integer AS match_score,
    ld.all_specializations AS specializations,
    ld.all_expertise AS expertise_areas
  FROM lawyer_data ld
  WHERE
    (p_practice_area IS NULL OR p_practice_area = '' OR ld.practice_areas @> ARRAY[p_practice_area]::text[])
    AND (p_location IS NULL OR p_location = '' OR ld.ny_locations @> ARRAY[p_location]::text[])
    AND (p_min_rate IS NULL OR ld.hourly_rate >= p_min_rate)
    AND (p_max_rate IS NULL OR ld.hourly_rate <= p_max_rate)
    AND (p_specific_issue IS NULL OR p_specific_issue = '' OR ld.specific_issues ? p_specific_issue)
    AND (p_languages IS NULL OR array_length(p_languages, 1) IS NULL OR ld.languages && p_languages)
  ORDER BY match_score DESC, ld.rating DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_lawyers_list TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_lawyers TO authenticated, anon;

-- Rebuild unbooked slots for existing availability to align with slot duration
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT DISTINCT lawyer_id
    FROM public.lawyer_date_availability
  ) LOOP
    PERFORM public.rebuild_time_slots_for_lawyer(rec.lawyer_id);
  END LOOP;
END;
$$;
