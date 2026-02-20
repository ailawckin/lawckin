-- Add optional reason to lawyer availability exceptions

ALTER TABLE public.lawyer_availability_exceptions
  ADD COLUMN IF NOT EXISTS reason text;
