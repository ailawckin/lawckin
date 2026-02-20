-- Add rejection reason column (conversion handled in follow-up migration)
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT;
