-- Harden search_lawyers_from_search input normalization for stable ranking
-- - trim and de-duplicate preferred languages
-- - trim and de-duplicate AI keywords
-- - ignore empty/"any" placeholder locations

CREATE OR REPLACE FUNCTION public.search_lawyers_from_search(
  p_search_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  specialty text,
  location text,
  practice_areas text[],
  ny_locations text[],
  experience_years integer,
  rating numeric,
  total_reviews integer,
  full_name text,
  avatar_url text,
  hourly_rate numeric,
  firm_name text,
  slot_duration_minutes integer,
  match_score integer,
  specializations jsonb,
  expertise_areas jsonb
) AS $$
DECLARE
  search_row record;
  min_rate numeric;
  max_rate numeric;
  languages_array text[];
  keywords_array text[];
  location_value text;
  locations_array text[];
BEGIN
  SELECT * INTO search_row
  FROM public.client_search cs
  WHERE cs.id = p_search_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  CASE search_row.budget_band
    WHEN 'Under $150/hr' THEN
      min_rate := NULL; max_rate := 150;
    WHEN '$150–$250/hr' THEN
      min_rate := 150; max_rate := 250;
    WHEN '$250–$400/hr' THEN
      min_rate := 250; max_rate := 400;
    WHEN '$400–$600/hr' THEN
      min_rate := 400; max_rate := 600;
    WHEN '$600+/hr' THEN
      min_rate := 600; max_rate := NULL;
    ELSE
      min_rate := NULL; max_rate := NULL;
  END CASE;

  IF search_row.preferred_language IS NOT NULL THEN
    SELECT ARRAY(
      SELECT DISTINCT LOWER(TRIM(lang))
      FROM unnest(regexp_split_to_array(search_row.preferred_language, '\\s*,\\s*')) lang
      WHERE TRIM(lang) <> ''
      ORDER BY 1
    ) INTO languages_array;
  END IF;

  IF search_row.ai_keywords IS NOT NULL THEN
    SELECT ARRAY(
      SELECT DISTINCT LOWER(TRIM(kw))
      FROM unnest(search_row.ai_keywords) kw
      WHERE TRIM(kw) <> ''
      ORDER BY 1
    ) INTO keywords_array;
  END IF;

  IF search_row.ny_locations IS NOT NULL AND array_length(search_row.ny_locations, 1) IS NOT NULL THEN
    SELECT ARRAY(
      SELECT DISTINCT TRIM(loc)
      FROM unnest(search_row.ny_locations) loc
      WHERE TRIM(loc) <> ''
        AND LOWER(TRIM(loc)) <> 'any'
      ORDER BY 1
    ) INTO locations_array;
  END IF;

  IF search_row.ny_location IS NOT NULL
    AND TRIM(search_row.ny_location) <> ''
    AND LOWER(TRIM(search_row.ny_location)) <> 'any' THEN
    location_value := TRIM(search_row.ny_location);
  END IF;

  RETURN QUERY
  SELECT * FROM public.search_lawyers_advanced(
    p_practice_area => COALESCE(search_row.practice_area, search_row.ai_practice_area),
    p_location => location_value,
    p_locations => locations_array,
    p_min_rate => min_rate,
    p_max_rate => max_rate,
    p_specific_issue => COALESCE(search_row.specific_issue, search_row.ai_specific_issue),
    p_languages => languages_array,
    p_keywords => keywords_array,
    p_urgency => search_row.urgency,
    p_embedding => search_row.ai_embedding,
    p_limit => p_limit
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.search_lawyers_from_search TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lawyers_from_search TO anon;
