-- Create client_search table to store search queries
CREATE TABLE public.client_search (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Core questions
  practice_area TEXT NOT NULL,
  ny_location TEXT NOT NULL,
  budget_band TEXT NOT NULL,
  
  -- Advanced questions (nullable)
  situation TEXT,
  urgency TEXT,
  meeting_preference TEXT,
  preferred_language TEXT,
  fee_model TEXT,
  
  -- Store matched lawyer IDs for tracking
  matched_lawyers UUID[]
);

-- Enable RLS
ALTER TABLE public.client_search ENABLE ROW LEVEL SECURITY;

-- Users can view their own searches
CREATE POLICY "Users can view their own searches"
ON public.client_search
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can create searches (logged in or anonymous)
CREATE POLICY "Anyone can create searches"
ON public.client_search
FOR INSERT
WITH CHECK (true);

-- Add columns to lawyer_profiles for better matching
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS practice_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ny_locations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hourly_min NUMERIC,
ADD COLUMN IF NOT EXISTS hourly_max NUMERIC,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English'],
ADD COLUMN IF NOT EXISTS meeting_types TEXT[] DEFAULT ARRAY['online', 'in-person'],
ADD COLUMN IF NOT EXISTS fee_models TEXT[] DEFAULT ARRAY['hourly'];

-- Create index for faster searches
CREATE INDEX idx_lawyer_profiles_practice_areas ON public.lawyer_profiles USING GIN(practice_areas);
CREATE INDEX idx_lawyer_profiles_ny_locations ON public.lawyer_profiles USING GIN(ny_locations);