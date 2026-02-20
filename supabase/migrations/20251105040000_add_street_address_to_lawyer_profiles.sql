-- Add street_address field for internal business address (not shown to clients)
-- The location field is used for client-facing service area
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS street_address TEXT;

-- Add comment to clarify field usage
COMMENT ON COLUMN public.lawyer_profiles.location IS 'Primary service area visible to clients (e.g., "Manhattan", "Brooklyn"). Must match curated NY service areas.';
COMMENT ON COLUMN public.lawyer_profiles.street_address IS 'Full business address for internal use only. Not displayed to clients.';

