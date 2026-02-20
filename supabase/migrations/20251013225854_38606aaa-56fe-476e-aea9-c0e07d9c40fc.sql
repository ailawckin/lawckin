-- Create practice_areas table
CREATE TABLE public.practice_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create lawyer_profiles table
CREATE TABLE public.lawyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  education TEXT,
  certifications TEXT[],
  languages TEXT[],
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_area_id UUID REFERENCES public.practice_areas(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Practice areas policies (public read)
CREATE POLICY "Anyone can view practice areas"
ON public.practice_areas FOR SELECT
USING (true);

CREATE POLICY "Admins can manage practice areas"
ON public.practice_areas FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Lawyer profiles policies
CREATE POLICY "Anyone can view lawyer profiles"
ON public.lawyer_profiles FOR SELECT
USING (true);

CREATE POLICY "Lawyers can update their own profile"
ON public.lawyer_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Lawyers can insert their own profile"
ON public.lawyer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'lawyer'));

CREATE POLICY "Admins can manage all lawyer profiles"
ON public.lawyer_profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Consultations policies
CREATE POLICY "Users can view their own consultations"
ON public.consultations FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = lawyer_id);

CREATE POLICY "Clients can create consultations"
ON public.consultations FOR INSERT
WITH CHECK (auth.uid() = client_id AND public.has_role(auth.uid(), 'client'));

CREATE POLICY "Clients and lawyers can update their consultations"
ON public.consultations FOR UPDATE
USING (auth.uid() = client_id OR auth.uid() = lawyer_id);

CREATE POLICY "Admins can manage all consultations"
ON public.consultations FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_lawyer_profiles_updated_at
BEFORE UPDATE ON public.lawyer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default practice areas
INSERT INTO public.practice_areas (name, description, icon) VALUES
('Family Law', 'Divorce, custody, adoption, and family matters', 'Home'),
('Criminal Defense', 'Criminal cases and defense representation', 'Shield'),
('Corporate Law', 'Business law, contracts, and corporate matters', 'Briefcase'),
('Real Estate', 'Property transactions and real estate law', 'Building'),
('Immigration', 'Immigration and citizenship matters', 'Globe'),
('Personal Injury', 'Accident and injury claims', 'AlertCircle');