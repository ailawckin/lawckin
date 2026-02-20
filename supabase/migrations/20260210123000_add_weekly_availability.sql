-- Add weekly availability templates and date exceptions

-- Tag date availability rows by source (manual vs weekly)
ALTER TABLE public.lawyer_date_availability
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lawyer_date_availability_source_check'
  ) THEN
    ALTER TABLE public.lawyer_date_availability
      ADD CONSTRAINT lawyer_date_availability_source_check
      CHECK (source IN ('manual', 'weekly', 'override'));
  END IF;
END $$;

-- Weekly availability template (one block per day)
CREATE TABLE IF NOT EXISTS public.lawyer_weekly_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid NOT NULL,
  day_of_week smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lawyer_weekly_availability_day_check CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT lawyer_weekly_availability_time_check CHECK (end_time > start_time),
  CONSTRAINT lawyer_weekly_availability_unique UNIQUE (lawyer_id, day_of_week)
);

ALTER TABLE public.lawyer_weekly_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage their weekly availability"
ON public.lawyer_weekly_availability
FOR ALL
USING (
  lawyer_id IN (SELECT id FROM lawyer_profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  lawyer_id IN (SELECT id FROM lawyer_profiles WHERE user_id = auth.uid())
);

-- Date exceptions (full-day blocks for now)
CREATE TABLE IF NOT EXISTS public.lawyer_availability_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid NOT NULL,
  exception_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lawyer_availability_exceptions_unique UNIQUE (lawyer_id, exception_date)
);

ALTER TABLE public.lawyer_availability_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage their availability exceptions"
ON public.lawyer_availability_exceptions
FOR ALL
USING (
  lawyer_id IN (SELECT id FROM lawyer_profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  lawyer_id IN (SELECT id FROM lawyer_profiles WHERE user_id = auth.uid())
);

-- Apply weekly availability to a date range by generating date-specific rows
CREATE OR REPLACE FUNCTION public.apply_weekly_availability(
  p_lawyer_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_day date;
  day_index int;
  weekly_rec record;
BEGIN
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'Start date and end date are required';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'End date must be on or after start date';
  END IF;

  -- Remove previously generated weekly availability in range
  DELETE FROM public.lawyer_date_availability
  WHERE lawyer_id = p_lawyer_id
    AND source = 'weekly'
    AND availability_date BETWEEN p_start_date AND p_end_date;

  current_day := p_start_date;
  WHILE current_day <= p_end_date LOOP
    -- Skip dates explicitly blocked
    IF EXISTS (
      SELECT 1
      FROM public.lawyer_availability_exceptions
      WHERE lawyer_id = p_lawyer_id
        AND exception_date = current_day
    ) THEN
      current_day := current_day + 1;
      CONTINUE;
    END IF;

    -- Skip dates with manual overrides
    IF EXISTS (
      SELECT 1
      FROM public.lawyer_date_availability
      WHERE lawyer_id = p_lawyer_id
        AND availability_date = current_day
        AND source = 'override'
    ) THEN
      current_day := current_day + 1;
      CONTINUE;
    END IF;

    day_index := EXTRACT(DOW FROM current_day)::int;

    FOR weekly_rec IN
      SELECT start_time, end_time
      FROM public.lawyer_weekly_availability
      WHERE lawyer_id = p_lawyer_id
        AND day_of_week = day_index
    LOOP
      INSERT INTO public.lawyer_date_availability (
        lawyer_id,
        availability_date,
        start_time,
        end_time,
        source
      ) VALUES (
        p_lawyer_id,
        current_day,
        weekly_rec.start_time,
        weekly_rec.end_time,
        'weekly'
      )
      ON CONFLICT (lawyer_id, availability_date, start_time, end_time) DO NOTHING;
    END LOOP;

    current_day := current_day + 1;
  END LOOP;
END;
$$;
