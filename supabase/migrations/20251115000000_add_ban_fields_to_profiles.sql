-- Add ban-related fields to profiles table for content moderation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Add index for faster queries on banned users
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(banned) WHERE banned = true;

-- Add comment explaining the fields
COMMENT ON COLUMN public.profiles.banned IS 'Whether the user has been banned from the platform';
COMMENT ON COLUMN public.profiles.banned_at IS 'Timestamp when the user was banned';
COMMENT ON COLUMN public.profiles.ban_reason IS 'Reason for the ban, set by admin during moderation';
