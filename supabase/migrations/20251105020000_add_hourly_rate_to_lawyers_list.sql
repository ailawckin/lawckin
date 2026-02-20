-- Update get_lawyers_list function to include hourly_rate and firm_name
-- Drop existing function first (can't change return type with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.get_lawyers_list();

CREATE FUNCTION public.get_lawyers_list()
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
  firm_name text
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
    lp.hourly_rate,
    f.firm_name
  FROM public.lawyer_profiles lp
  JOIN public.profiles p ON p.user_id = lp.user_id
  LEFT JOIN public.firms f ON f.id = lp.firm_id
  WHERE COALESCE(lp.verified, false) = true
    AND COALESCE(lp.status, 'active') = 'active'
  ORDER BY lp.rating DESC NULLS LAST
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

