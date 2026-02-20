-- Ensure availability source constraint includes override

ALTER TABLE public.lawyer_date_availability
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE public.lawyer_date_availability
  DROP CONSTRAINT IF EXISTS lawyer_date_availability_source_check;

ALTER TABLE public.lawyer_date_availability
  ADD CONSTRAINT lawyer_date_availability_source_check
  CHECK (source IN ('manual', 'weekly', 'override'));
