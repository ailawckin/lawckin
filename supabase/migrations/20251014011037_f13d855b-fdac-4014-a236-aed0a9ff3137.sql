-- Create profile_views table for analytics
CREATE TABLE public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_profile_views_lawyer ON public.profile_views(lawyer_id);
CREATE INDEX idx_profile_views_viewed_at ON public.profile_views(viewed_at);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Lawyers can view their own profile analytics
CREATE POLICY "Lawyers can view their own profile views"
  ON public.profile_views FOR SELECT
  USING (
    lawyer_id IN (
      SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
    )
  );

-- Anyone can insert profile views
CREATE POLICY "Anyone can record profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

-- Create time_slots table for lawyer availability
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booking_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_slots_lawyer ON public.time_slots(lawyer_id);
CREATE INDEX idx_time_slots_start_time ON public.time_slots(start_time);
CREATE INDEX idx_time_slots_available ON public.time_slots(lawyer_id, is_booked) WHERE is_booked = false;

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can view available time slots
CREATE POLICY "Anyone can view available time slots"
  ON public.time_slots FOR SELECT
  USING (true);

-- Lawyers can manage their own time slots
CREATE POLICY "Lawyers can manage their own time slots"
  ON public.time_slots FOR ALL
  USING (
    lawyer_id IN (
      SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
    )
  );

-- Create recurring_availability table
CREATE TABLE public.recurring_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_availability_lawyer ON public.recurring_availability(lawyer_id);

ALTER TABLE public.recurring_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can view recurring availability
CREATE POLICY "Anyone can view recurring availability"
  ON public.recurring_availability FOR SELECT
  USING (true);

-- Lawyers can manage their own recurring availability
CREATE POLICY "Lawyers can manage their own recurring availability"
  ON public.recurring_availability FOR ALL
  USING (
    lawyer_id IN (
      SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
    )
  );

-- Create availability_overrides table for special dates
CREATE TABLE public.availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_availability_overrides_lawyer ON public.availability_overrides(lawyer_id);
CREATE INDEX idx_availability_overrides_date ON public.availability_overrides(override_date);

ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone can view availability overrides
CREATE POLICY "Anyone can view availability overrides"
  ON public.availability_overrides FOR SELECT
  USING (true);

-- Lawyers can manage their own availability overrides
CREATE POLICY "Lawyers can manage their own availability overrides"
  ON public.availability_overrides FOR ALL
  USING (
    lawyer_id IN (
      SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
    )
  );

-- Update consultations table with meeting room info
ALTER TABLE public.consultations 
  ADD COLUMN IF NOT EXISTS meeting_room_id TEXT,
  ADD COLUMN IF NOT EXISTS client_join_link TEXT,
  ADD COLUMN IF NOT EXISTS lawyer_join_link TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Create bookings view for easier querying
CREATE OR REPLACE VIEW public.bookings_with_details AS
SELECT 
  c.id,
  c.client_id,
  c.lawyer_id,
  c.scheduled_at,
  c.duration_minutes,
  c.status,
  c.amount,
  c.payment_status,
  c.meeting_room_id,
  c.client_join_link,
  c.lawyer_join_link,
  c.notes,
  c.created_at,
  cp.full_name as client_name,
  cp.email as client_email,
  lp.full_name as lawyer_name,
  lp.email as lawyer_email,
  pa.name as practice_area_name
FROM public.consultations c
LEFT JOIN public.profiles cp ON c.client_id = cp.user_id
LEFT JOIN public.lawyer_profiles lpr ON c.lawyer_id = lpr.id
LEFT JOIN public.profiles lp ON lpr.user_id = lp.user_id
LEFT JOIN public.practice_areas pa ON c.practice_area_id = pa.id;

-- Add columns to profiles table for onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Function to generate time slots for a lawyer
CREATE OR REPLACE FUNCTION public.generate_time_slots_for_lawyer(
  p_lawyer_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_slot_duration_minutes INTEGER DEFAULT 60
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_date DATE;
  v_day_of_week INTEGER;
  v_slot_count INTEGER := 0;
  v_slot_start TIMESTAMP WITH TIME ZONE;
  v_slot_end TIMESTAMP WITH TIME ZONE;
  v_availability RECORD;
  v_override RECORD;
BEGIN
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date);
    
    -- Check for override first
    SELECT * INTO v_override
    FROM public.availability_overrides
    WHERE lawyer_id = p_lawyer_id
      AND override_date = v_current_date
    LIMIT 1;
    
    IF FOUND THEN
      IF v_override.is_available AND v_override.start_time IS NOT NULL THEN
        -- Create slots for override times
        v_slot_start := v_current_date + v_override.start_time;
        
        WHILE v_slot_start < v_current_date + v_override.end_time LOOP
          v_slot_end := v_slot_start + (p_slot_duration_minutes || ' minutes')::INTERVAL;
          
          IF v_slot_end <= v_current_date + v_override.end_time THEN
            INSERT INTO public.time_slots (lawyer_id, start_time, end_time)
            VALUES (p_lawyer_id, v_slot_start, v_slot_end)
            ON CONFLICT DO NOTHING;
            v_slot_count := v_slot_count + 1;
          END IF;
          
          v_slot_start := v_slot_end;
        END LOOP;
      END IF;
    ELSE
      -- Use recurring availability
      FOR v_availability IN
        SELECT * FROM public.recurring_availability
        WHERE lawyer_id = p_lawyer_id
          AND day_of_week = v_day_of_week
      LOOP
        v_slot_start := v_current_date + v_availability.start_time;
        
        WHILE v_slot_start < v_current_date + v_availability.end_time LOOP
          v_slot_end := v_slot_start + (p_slot_duration_minutes || ' minutes')::INTERVAL;
          
          IF v_slot_end <= v_current_date + v_availability.end_time THEN
            INSERT INTO public.time_slots (lawyer_id, start_time, end_time)
            VALUES (p_lawyer_id, v_slot_start, v_slot_end)
            ON CONFLICT DO NOTHING;
            v_slot_count := v_slot_count + 1;
          END IF;
          
          v_slot_start := v_slot_end;
        END LOOP;
      END LOOP;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
  
  RETURN v_slot_count;
END;
$$;