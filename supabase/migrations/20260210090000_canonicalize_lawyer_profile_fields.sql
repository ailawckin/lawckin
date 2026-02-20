-- Canonicalize lawyer profile fields for practice areas, service locations, and address

-- Backfill practice_areas from specialty when empty
UPDATE public.lawyer_profiles
SET practice_areas = ARRAY[NULLIF(specialty, '')]
WHERE (practice_areas IS NULL OR array_length(practice_areas, 1) IS NULL)
  AND specialty IS NOT NULL
  AND specialty <> '';

-- Backfill ny_locations from location when empty
UPDATE public.lawyer_profiles
SET ny_locations = ARRAY[location]
WHERE (ny_locations IS NULL OR array_length(ny_locations, 1) IS NULL)
  AND location IS NOT NULL
  AND location <> '';

-- Backfill address_street from street_address if missing
UPDATE public.lawyer_profiles
SET address_street = street_address
WHERE address_street IS NULL
  AND street_address IS NOT NULL
  AND street_address <> '';

-- Keep legacy street_address in sync if missing
UPDATE public.lawyer_profiles
SET street_address = address_street
WHERE street_address IS NULL
  AND address_street IS NOT NULL
  AND address_street <> '';
