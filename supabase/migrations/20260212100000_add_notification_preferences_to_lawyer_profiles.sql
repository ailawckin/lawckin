-- Add notification preference flags to lawyer profiles

ALTER TABLE public.lawyer_profiles
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_sms boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_consultation_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_marketing boolean NOT NULL DEFAULT false;
