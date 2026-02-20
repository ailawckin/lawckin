-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Store embeddings for lawyer profiles
ALTER TABLE public.lawyer_profiles
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_text TEXT,
  ADD COLUMN IF NOT EXISTS embedding_model TEXT,
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Store embeddings for AI-powered client searches
ALTER TABLE public.client_search
  ADD COLUMN IF NOT EXISTS ai_embedding vector(1536),
  ADD COLUMN IF NOT EXISTS ai_embedding_model TEXT;

-- Speed up semantic search
CREATE INDEX IF NOT EXISTS idx_lawyer_profiles_embedding
  ON public.lawyer_profiles
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Replace advanced search with embedding-aware scoring
DROP FUNCTION IF EXISTS public.search_lawyers_advanced(
  TEXT,
  TEXT,
  TEXT[],
  NUMERIC,
  NUMERIC,
  TEXT,
  TEXT[],
  TEXT[],
  TEXT,
  INTEGER
);
DROP FUNCTION IF EXISTS public.search_lawyers_advanced(
  TEXT,
  TEXT,
  NUMERIC,
  NUMERIC,
  TEXT,
  TEXT[],
  TEXT[],
  TEXT,
  INTEGER
);

CREATE OR REPLACE FUNCTION public.search_lawyers_advanced(
  p_practice_area TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_locations TEXT[] DEFAULT NULL,
  p_min_rate NUMERIC DEFAULT NULL,
  p_max_rate NUMERIC DEFAULT NULL,
  p_specific_issue TEXT DEFAULT NULL,
  p_languages TEXT[] DEFAULT NULL,
  p_keywords TEXT[] DEFAULT NULL,
  p_urgency TEXT DEFAULT NULL,
  p_embedding vector(1536) DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
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
BEGIN
  RETURN QUERY
  WITH lawyer_data AS (
    SELECT
      lp.id,
      lp.user_id,
      COALESCE(NULLIF(lp.specialty, ''), (lp.practice_areas)[1]) as specialty,
      COALESCE(NULLIF(lp.location, ''), (lp.ny_locations)[1]) as location,
      lp.practice_areas,
      lp.ny_locations,
      lp.experience_years,
      lp.rating,
      lp.total_reviews,
      p.full_name,
      p.avatar_url,
      lp.hourly_rate,
      lp.slot_duration_minutes,
      f.firm_name,
      lp.specific_issues,
      lp.languages,
      lp.embedding,
      COALESCE(lp.bio, '') as bio,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'name', pas.specialization_name,
            'years', ls.years_experience
          )
        ) FILTER (WHERE pas.id IS NOT NULL),
        '[]'::jsonb
      ) as all_specializations,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'area', pa.name,
            'years', le.years_experience
          )
        ) FILTER (WHERE pa.id IS NOT NULL),
        '[]'::jsonb
      ) as all_expertise,
      lv.total_views,
      next_slot.next_available_at,
      LOWER(
        COALESCE(lp.specialty, '') || ' ' ||
        COALESCE(array_to_string(lp.practice_areas, ' '), '') || ' ' ||
        COALESCE(array_to_string(lp.ny_locations, ' '), '') || ' ' ||
        COALESCE(lp.location, '') || ' ' ||
        COALESCE(lp.bio, '') || ' ' ||
        COALESCE(array_to_string(lp.languages, ' '), '') || ' ' ||
        COALESCE(string_agg(DISTINCT pas.specialization_name, ' '), '')
      ) as search_text
    FROM public.lawyer_profiles lp
    JOIN public.profiles p ON p.user_id = lp.user_id
    LEFT JOIN public.firms f ON f.id = lp.firm_id
    LEFT JOIN public.lawyer_specializations ls ON ls.lawyer_id = lp.id
    LEFT JOIN public.practice_area_specializations pas ON pas.id = ls.specialization_id
    LEFT JOIN public.lawyer_expertise le ON le.lawyer_id = lp.id
    LEFT JOIN public.practice_areas pa ON pa.id = le.practice_area_id
    LEFT JOIN public.lawyer_view_stats lv ON lv.lawyer_id = lp.id
    LEFT JOIN LATERAL (
      SELECT MIN(ts.start_time) as next_available_at
      FROM public.time_slots ts
      WHERE ts.lawyer_id = lp.id
        AND ts.is_booked = false
        AND ts.start_time >= now()
    ) next_slot ON true
    WHERE COALESCE(lp.verified, false) = true
      AND COALESCE(lp.status, 'active') = 'active'
      AND COALESCE(lp.profile_visible, true) = true
      AND COALESCE(lp.accepting_new_clients, true) = true
    GROUP BY lp.id, p.full_name, p.avatar_url, f.firm_name, lp.specific_issues, lp.languages,
      lp.practice_areas, lp.ny_locations, lv.total_views, next_slot.next_available_at,
      lp.slot_duration_minutes, lp.embedding
  ),
  scored_lawyers AS (
    SELECT
      ld.*,
      CASE
        WHEN p_locations IS NOT NULL AND array_length(p_locations, 1) IS NOT NULL THEN
          (
            (ld.ny_locations IS NOT NULL AND EXISTS (
              SELECT 1 FROM unnest(ld.ny_locations) loc
              WHERE EXISTS (
                SELECT 1 FROM unnest(p_locations) match_loc
                WHERE LOWER(loc) = LOWER(match_loc)
              )
            )) OR
            (ld.location IS NOT NULL AND EXISTS (
              SELECT 1 FROM unnest(p_locations) match_loc
              WHERE LOWER(ld.location) = LOWER(match_loc)
                 OR LOWER(ld.location) LIKE '%' || LOWER(match_loc) || '%'
            ))
          )
        WHEN p_location IS NOT NULL THEN
          (
            (ld.ny_locations IS NOT NULL AND EXISTS (
              SELECT 1 FROM unnest(ld.ny_locations) loc
              WHERE LOWER(loc) = LOWER(p_location)
            )) OR
            (ld.location IS NOT NULL AND (
              LOWER(ld.location) = LOWER(p_location)
              OR LOWER(ld.location) LIKE '%' || LOWER(p_location) || '%'
            ))
          )
        ELSE true
      END as location_match,
      CASE
        WHEN p_embedding IS NULL OR ld.embedding IS NULL THEN 0
        ELSE LEAST(30, GREATEST(0, ROUND((1 - (ld.embedding <=> p_embedding)) * 30)))::int
      END as semantic_score,
      (
        CASE
          WHEN p_practice_area IS NULL THEN 35
          WHEN ld.practice_areas IS NOT NULL AND EXISTS (
            SELECT 1 FROM unnest(ld.practice_areas) area
            WHERE LOWER(area) LIKE '%' || LOWER(p_practice_area) || '%'
          ) THEN 40
          WHEN LOWER(ld.specialty) LIKE '%' || LOWER(p_practice_area) || '%' THEN 38
          WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements(ld.all_expertise) elem
            WHERE LOWER(elem->>'area') LIKE '%' || LOWER(p_practice_area) || '%'
          ) THEN 34
          WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements(ld.all_specializations) elem
            WHERE LOWER(elem->>'name') LIKE '%' || LOWER(p_practice_area) || '%'
          ) THEN 30
          ELSE 0
        END +
        CASE
          WHEN p_locations IS NOT NULL AND array_length(p_locations, 1) IS NOT NULL THEN
            CASE
              WHEN ld.ny_locations IS NOT NULL AND EXISTS (
                SELECT 1 FROM unnest(ld.ny_locations) loc
                WHERE EXISTS (
                  SELECT 1 FROM unnest(p_locations) match_loc
                  WHERE LOWER(loc) = LOWER(match_loc)
                )
              ) THEN 24
              WHEN ld.location IS NOT NULL AND EXISTS (
                SELECT 1 FROM unnest(p_locations) match_loc
                WHERE LOWER(ld.location) = LOWER(match_loc)
              ) THEN 22
              WHEN ld.location IS NOT NULL AND EXISTS (
                SELECT 1 FROM unnest(p_locations) match_loc
                WHERE LOWER(ld.location) LIKE '%' || LOWER(match_loc) || '%'
              ) THEN 18
              ELSE 0
            END
          WHEN p_location IS NULL THEN 18
          WHEN ld.ny_locations IS NOT NULL AND EXISTS (
            SELECT 1 FROM unnest(ld.ny_locations) loc
            WHERE LOWER(loc) = LOWER(p_location)
          ) THEN 24
          WHEN LOWER(ld.location) = LOWER(p_location) THEN 22
          WHEN LOWER(ld.location) LIKE '%' || LOWER(p_location) || '%' THEN 18
          ELSE 0
        END +
        CASE
          WHEN p_min_rate IS NULL AND p_max_rate IS NULL THEN 12
          WHEN ld.hourly_rate IS NULL THEN 8
          WHEN ld.hourly_rate BETWEEN COALESCE(p_min_rate, 0) AND COALESCE(p_max_rate, 999999) THEN 12
          WHEN ld.hourly_rate <= COALESCE(p_max_rate, 999999) * 1.2 THEN 8
          ELSE 0
        END +
        CASE
          WHEN p_specific_issue IS NULL THEN 12
          WHEN ld.specific_issues IS NOT NULL AND (
            ld.specific_issues ? p_specific_issue OR
            EXISTS (
              SELECT 1 FROM jsonb_each(ld.specific_issues) kv
              WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(kv.value) issue
                WHERE LOWER(issue) LIKE '%' || LOWER(p_specific_issue) || '%'
              )
            )
          ) THEN 16
          WHEN ld.specific_issues IS NOT NULL THEN 8
          ELSE 0
        END +
        CASE
          WHEN p_languages IS NULL OR array_length(p_languages, 1) IS NULL THEN 0
          WHEN ld.languages IS NOT NULL AND ld.languages && p_languages THEN 6
          ELSE 0
        END +
        CASE
          WHEN p_keywords IS NULL OR array_length(p_keywords, 1) IS NULL THEN 0
          ELSE LEAST(12, (
            SELECT COUNT(*)
            FROM unnest(p_keywords) kw
            WHERE ld.search_text LIKE '%' || LOWER(kw) || '%'
          ) * 2)
        END +
        CASE
          WHEN ld.next_available_at IS NULL THEN 0
          ELSE
            CASE
              WHEN p_urgency ILIKE 'Today%' THEN GREATEST(0, 18 - CEIL(EXTRACT(EPOCH FROM (ld.next_available_at - now())) / 3600))
              WHEN p_urgency ILIKE 'Next few days%' THEN GREATEST(0, 14 - CEIL(EXTRACT(EPOCH FROM (ld.next_available_at - now())) / 86400) * 2)
              WHEN p_urgency ILIKE 'Next week%' THEN GREATEST(0, 10 - CEIL(EXTRACT(EPOCH FROM (ld.next_available_at - now())) / 86400))
              ELSE GREATEST(0, 8 - CEIL(EXTRACT(EPOCH FROM (ld.next_available_at - now())) / 86400))
            END
        END +
        CASE
          WHEN ld.rating IS NULL THEN 0
          WHEN ld.rating >= 4.7 THEN 10
          WHEN ld.rating >= 4.5 THEN 8
          WHEN ld.rating >= 4.0 THEN 6
          WHEN ld.rating >= 3.5 THEN 4
          ELSE 2
        END +
        CASE
          WHEN ld.total_reviews IS NULL THEN 0
          WHEN ld.total_reviews >= 50 THEN 5
          WHEN ld.total_reviews >= 20 THEN 3
          WHEN ld.total_reviews >= 5 THEN 2
          ELSE 0
        END +
        CASE
          WHEN ld.total_views IS NULL THEN 4
          WHEN ld.total_views <= 25 THEN 4
          WHEN ld.total_views <= 100 THEN 2
          ELSE 0
        END +
        CASE
          WHEN p_embedding IS NULL OR ld.embedding IS NULL THEN 0
          ELSE LEAST(30, GREATEST(0, ROUND((1 - (ld.embedding <=> p_embedding)) * 30)))::int
        END
      )::int as score
    FROM lawyer_data ld
  )
  SELECT
    sl.id,
    sl.user_id,
    sl.specialty,
    sl.location,
    sl.practice_areas,
    sl.ny_locations,
    sl.experience_years,
    sl.rating,
    sl.total_reviews,
    sl.full_name,
    sl.avatar_url,
    sl.hourly_rate,
    sl.slot_duration_minutes,
    sl.firm_name,
    sl.score as match_score,
    sl.all_specializations as specializations,
    sl.all_expertise as expertise_areas
  FROM scored_lawyers sl
  WHERE sl.score >= 20
    AND sl.location_match = true
  ORDER BY
    sl.score DESC,
    sl.semantic_score DESC,
    sl.rating DESC NULLS LAST,
    sl.total_reviews DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.search_lawyers_advanced TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lawyers_advanced TO anon;

-- Convenience wrapper to search from stored client_search rows
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
  location_value text;
  locations_array text[];
BEGIN
  SELECT * INTO search_row
  FROM public.client_search
  WHERE id = p_search_id;

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
    languages_array := regexp_split_to_array(search_row.preferred_language, '\\s*,\\s*');
  END IF;

  IF search_row.ny_locations IS NOT NULL AND array_length(search_row.ny_locations, 1) IS NOT NULL THEN
    locations_array := search_row.ny_locations;
  END IF;

  IF search_row.ny_location IS NOT NULL AND LOWER(search_row.ny_location) <> 'any' THEN
    location_value := search_row.ny_location;
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
    p_keywords => search_row.ai_keywords,
    p_urgency => search_row.urgency,
    p_embedding => search_row.ai_embedding,
    p_limit => p_limit
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.search_lawyers_from_search TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lawyers_from_search TO anon;
