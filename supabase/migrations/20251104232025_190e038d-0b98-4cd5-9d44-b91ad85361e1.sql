-- Create practice_area_specializations table
CREATE TABLE public.practice_area_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_area_id UUID NOT NULL REFERENCES public.practice_areas(id) ON DELETE CASCADE,
  specialization_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(practice_area_id, specialization_name)
);

-- Create lawyer_specializations table
CREATE TABLE public.lawyer_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES public.practice_area_specializations(id) ON DELETE CASCADE,
  years_experience INTEGER NOT NULL DEFAULT 0 CHECK (years_experience >= 0 AND years_experience <= 60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lawyer_id, specialization_id)
);

-- Enable RLS
ALTER TABLE public.practice_area_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_specializations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_area_specializations
CREATE POLICY "Anyone can view specializations"
  ON public.practice_area_specializations
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage specializations"
  ON public.practice_area_specializations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lawyer_specializations
CREATE POLICY "Anyone can view lawyer specializations"
  ON public.lawyer_specializations
  FOR SELECT
  USING (true);

CREATE POLICY "Lawyers can manage their own specializations"
  ON public.lawyer_specializations
  FOR ALL
  USING (lawyer_id IN (
    SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all specializations"
  ON public.lawyer_specializations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_lawyer_specializations_updated_at
  BEFORE UPDATE ON public.lawyer_specializations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_specializations_practice_area ON public.practice_area_specializations(practice_area_id);
CREATE INDEX idx_lawyer_specializations_lawyer ON public.lawyer_specializations(lawyer_id);
CREATE INDEX idx_lawyer_specializations_specialization ON public.lawyer_specializations(specialization_id);