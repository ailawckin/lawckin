-- Create a safe function to list publicly visible lawyers with basic profile info
CREATE OR REPLACE FUNCTION public.get_lawyers_list()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  specialty text,
  location text,
  experience_years integer,
  rating numeric,
  total_reviews integer,
  full_name text,
  avatar_url text
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
    p.avatar_url
  FROM public.lawyer_profiles lp
  JOIN public.profiles p ON p.user_id = lp.user_id
  WHERE COALESCE(lp.verified, false) = true
    AND COALESCE(lp.status, 'active') = 'active'
  ORDER BY lp.rating DESC NULLS LAST
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;