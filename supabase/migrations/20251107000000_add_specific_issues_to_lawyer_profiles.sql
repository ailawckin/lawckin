-- Add specific_issues column to lawyer_profiles table
-- Stores a JSONB object mapping practice area names to arrays of specific issues
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS specific_issues JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.lawyer_profiles.specific_issues IS 'JSONB object mapping practice area names to arrays of specific issues the lawyer handles. Example: {"Family Law": ["Divorce (contested)", "Child custody"], "Criminal Defense": ["Misdemeanor", "DWI / DUI"]}';

-- Create index for faster queries on specific_issues
CREATE INDEX IF NOT EXISTS idx_lawyer_profiles_specific_issues ON public.lawyer_profiles USING GIN(specific_issues);

