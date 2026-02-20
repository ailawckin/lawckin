-- Create function to get a single lawyer profile by ID
CREATE OR REPLACE FUNCTION public.get_lawyer_profile(lawyer_profile_id uuid)
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
  bio text,
  bar_number text,
  hourly_rate numeric,
  hourly_min numeric,
  hourly_max numeric,
  verified boolean,
  verification_status text,
  practice_areas text[],
  ny_locations text[],
  languages text[],
  fee_models text[],
  meeting_types text[]
) AS $$
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
    p.bio,
    lp.bar_number,
    lp.hourly_rate,
    lp.hourly_min,
    lp.hourly_max,
    lp.verified,
    lp.verification_status,
    lp.practice_areas,
    lp.ny_locations,
    lp.languages,
    lp.fee_models,
    lp.meeting_types
  FROM public.lawyer_profiles lp
  JOIN public.profiles p ON p.user_id = lp.user_id
  WHERE lp.id = lawyer_profile_id
  LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;