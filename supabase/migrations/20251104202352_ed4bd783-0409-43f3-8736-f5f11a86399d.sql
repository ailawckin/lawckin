-- Create lawyer_expertise table
CREATE TABLE public.lawyer_expertise (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id uuid NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  practice_area_id uuid NOT NULL REFERENCES public.practice_areas(id) ON DELETE CASCADE,
  years_experience integer NOT NULL CHECK (years_experience >= 0 AND years_experience <= 50),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(lawyer_id, practice_area_id)
);

-- Enable RLS
ALTER TABLE public.lawyer_expertise ENABLE ROW LEVEL SECURITY;

-- Anyone can view expertise data
CREATE POLICY "Anyone can view lawyer expertise"
ON public.lawyer_expertise
FOR SELECT
USING (true);

-- Lawyers can manage their own expertise
CREATE POLICY "Lawyers can manage their own expertise"
ON public.lawyer_expertise
FOR ALL
USING (
  lawyer_id IN (
    SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
  )
);

-- Admins can manage all expertise
CREATE POLICY "Admins can manage all expertise"
ON public.lawyer_expertise
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_lawyer_expertise_updated_at
BEFORE UPDATE ON public.lawyer_expertise
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();