-- Add structured business address fields for lawyer profiles
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_unit TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state TEXT,
ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT;
