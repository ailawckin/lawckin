-- Include languages + next availability in lawyer list/search functions for card display

DROP FUNCTION IF EXISTS public.get_lawyers_list();

CREATE FUNCTION public.get_lawyers_list()
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
  slot_duration_minutes integer,
  firm_name text,
  languages text[],
  next_available_at timestamptz
) AS $$
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
    lp.languages,
    next_slot.next_available_at
  FROM public.lawyer_profiles lp
  JOIN public.profiles p ON p.user_id = lp.user_id
  LEFT JOIN public.firms f ON f.id = lp.firm_id
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
  ORDER BY lp.rating DESC NULLS LAST
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_lawyers_list TO authenticated, anon;
