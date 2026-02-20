-- Create comprehensive lawyer search function with intelligent matching and relevance scoring
-- This replaces basic client-side filtering with database-level search

CREATE OR REPLACE FUNCTION public.search_lawyers(
  p_practice_area TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_min_rate NUMERIC DEFAULT NULL,
  p_max_rate NUMERIC DEFAULT NULL,
  p_specific_issue TEXT DEFAULT NULL,
  p_languages TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  specialty text,
  location text,
  experience_years integer,
  rating numeric,
  total_reviews integer,
  full_name text,
  avatar_url text,
  hourly_rate numeric,
  firm_name text,
  match_score integer,  -- Relevance score (0-100)
  specializations jsonb,  -- Array of specializations
  expertise_areas jsonb  -- Array of practice areas with years
) AS $$
BEGIN
  RETURN QUERY
  WITH lawyer_data AS (
    SELECT
      lp.id,
      lp.user_id,
      lp.specialty,
      lp.location,
      lp.experience_years,
      lp.rating,
      lp.total_reviews,
      p.full_name,
      p.avatar_url,
      lp.hourly_rate,
      f.firm_name,
      lp.specific_issues,
      lp.ny_locations,
      lp.languages,
      -- Aggregate specializations
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'name', pas.specialization_name,
            'years', ls.years_experience
          )
        ) FILTER (WHERE pas.id IS NOT NULL),
        '[]'::jsonb
      ) as all_specializations,
      -- Aggregate expertise areas
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'area', pa.name,
            'years', le.years_experience
          )
        ) FILTER (WHERE pa.id IS NOT NULL),
        '[]'::jsonb
      ) as all_expertise
    FROM public.lawyer_profiles lp
    JOIN public.profiles p ON p.user_id = lp.user_id
    LEFT JOIN public.firms f ON f.id = lp.firm_id
    LEFT JOIN public.lawyer_specializations ls ON ls.lawyer_id = lp.id
    LEFT JOIN public.practice_area_specializations pas ON pas.id = ls.specialization_id
    LEFT JOIN public.lawyer_expertise le ON le.lawyer_id = lp.id
    LEFT JOIN public.practice_areas pa ON pa.id = le.practice_area_id
    WHERE COALESCE(lp.verified, false) = true
      AND COALESCE(lp.status, 'active') = 'active'
    GROUP BY lp.id, p.full_name, p.avatar_url, f.firm_name, lp.specific_issues, lp.ny_locations, lp.languages
  ),
  scored_lawyers AS (
    SELECT
      ld.*,
      -- Calculate match score (0-100)
      (
        -- Practice area match (40 points)
        CASE
          WHEN p_practice_area IS NULL THEN 40
          WHEN LOWER(ld.specialty) LIKE '%' || LOWER(p_practice_area) || '%' THEN 40
          WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements(ld.all_expertise) elem
            WHERE LOWER(elem->>'area') LIKE '%' || LOWER(p_practice_area) || '%'
          ) THEN 35
          WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements(ld.all_specializations) elem
            WHERE LOWER(elem->>'name') LIKE '%' || LOWER(p_practice_area) || '%'
          ) THEN 30
          ELSE 0
        END +
        -- Location match (20 points)
        CASE
          WHEN p_location IS NULL THEN 20
          WHEN ld.ny_locations IS NOT NULL AND EXISTS (
            SELECT 1 FROM unnest(ld.ny_locations) loc
            WHERE LOWER(loc) = LOWER(p_location)
          ) THEN 25  -- Exact match in ny_locations array
          WHEN LOWER(ld.location) LIKE '%' || LOWER(p_location) || '%' THEN 20
          WHEN LOWER(ld.location) = LOWER(p_location) THEN 25  -- Exact match bonus
          ELSE 0
        END +
        -- Hourly rate match (15 points)
        CASE
          WHEN p_min_rate IS NULL AND p_max_rate IS NULL THEN 15
          WHEN ld.hourly_rate IS NULL THEN 10
          WHEN ld.hourly_rate BETWEEN COALESCE(p_min_rate, 0) AND COALESCE(p_max_rate, 999999) THEN 15
          WHEN ld.hourly_rate <= COALESCE(p_max_rate, 999999) * 1.2 THEN 10  -- Within 20% of budget
          ELSE 0
        END +
        -- Specific issue match (15 points)
        -- specific_issues is a JSONB object: {"Family Law": ["Divorce (contested)", ...], ...}
        CASE
          WHEN p_specific_issue IS NULL THEN 15
          WHEN ld.specific_issues IS NOT NULL AND (
            -- Check if any practice area has this specific issue (exact key match)
            ld.specific_issues ? p_specific_issue OR
            -- Check if any array value contains the search term (partial match)
            EXISTS (
              SELECT 1 FROM jsonb_each(ld.specific_issues) kv
              WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(kv.value) issue
                WHERE LOWER(issue) LIKE '%' || LOWER(p_specific_issue) || '%'
              )
            )
          ) THEN 15
          WHEN ld.specific_issues IS NOT NULL THEN 8  -- Has specific issues but not exact match
          ELSE 0
        END +
        -- Language match (bonus 5 points if available)
        CASE
          WHEN p_languages IS NULL OR array_length(p_languages, 1) IS NULL THEN 0
          WHEN ld.languages IS NOT NULL AND ld.languages && p_languages THEN 5  -- Array overlap
          ELSE 0
        END +
        -- Rating bonus (10 points)
        CASE
          WHEN ld.rating IS NULL THEN 0
          WHEN ld.rating >= 4.5 THEN 10
          WHEN ld.rating >= 4.0 THEN 7
          WHEN ld.rating >= 3.5 THEN 5
          ELSE 2
        END
      ) as score
    FROM lawyer_data ld
  )
  SELECT
    sl.id,
    sl.user_id,
    sl.specialty,
    sl.location,
    sl.experience_years,
    sl.rating,
    sl.total_reviews,
    sl.full_name,
    sl.avatar_url,
    sl.hourly_rate,
    sl.firm_name,
    sl.score as match_score,
    sl.all_specializations as specializations,
    sl.all_expertise as expertise_areas
  FROM scored_lawyers sl
  WHERE sl.score >= 20  -- Minimum 20% match
  ORDER BY
    sl.score DESC,  -- Best matches first
    sl.rating DESC NULLS LAST,  -- Then by rating
    sl.total_reviews DESC NULLS LAST  -- Then by review count
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_lawyers TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lawyers TO anon;

