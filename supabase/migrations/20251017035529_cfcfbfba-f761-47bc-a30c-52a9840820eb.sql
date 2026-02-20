-- Create new table for date-specific lawyer availability
CREATE TABLE IF NOT EXISTS public.lawyer_date_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id uuid NOT NULL,
  availability_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_lawyer_date_time UNIQUE (lawyer_id, availability_date, start_time, end_time)
);

-- Enable RLS
ALTER TABLE public.lawyer_date_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view date availability"
ON public.lawyer_date_availability
FOR SELECT
USING (true);

CREATE POLICY "Lawyers can manage their own date availability"
ON public.lawyer_date_availability
FOR ALL
USING (
  lawyer_id IN (
    SELECT id FROM lawyer_profiles WHERE user_id = auth.uid()
  )
);

-- Drop old triggers for recurring availability
DROP TRIGGER IF EXISTS regenerate_slots_on_availability_change ON public.recurring_availability;
DROP TRIGGER IF EXISTS cleanup_slots_on_availability_delete ON public.recurring_availability;

-- Create new function to generate time slots from date-specific availability
CREATE OR REPLACE FUNCTION public.generate_time_slots_from_date_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_base_timestamp timestamptz;
  v_slot_duration interval := '60 minutes';
BEGIN
  -- Create base timestamp for the availability date
  v_base_timestamp := NEW.availability_date::timestamptz;
  
  -- Delete existing unbooked slots for this lawyer on this date and time range
  DELETE FROM public.time_slots
  WHERE lawyer_id = NEW.lawyer_id
    AND is_booked = false
    AND start_time::date = NEW.availability_date
    AND start_time::time >= NEW.start_time
    AND end_time::time <= NEW.end_time;
  
  -- Generate new time slots
  v_slot_start := v_base_timestamp + NEW.start_time;
  
  WHILE v_slot_start < v_base_timestamp + NEW.end_time LOOP
    v_slot_end := v_slot_start + v_slot_duration;
    
    IF v_slot_end <= v_base_timestamp + NEW.end_time THEN
      INSERT INTO public.time_slots (lawyer_id, start_time, end_time)
      VALUES (NEW.lawyer_id, v_slot_start, v_slot_end)
      ON CONFLICT DO NOTHING;
    END IF;
    
    v_slot_start := v_slot_end;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate slots when date availability is added
CREATE TRIGGER generate_slots_on_date_availability_insert
AFTER INSERT ON public.lawyer_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.generate_time_slots_from_date_availability();

-- Create function to cleanup time slots when date availability is deleted
CREATE OR REPLACE FUNCTION public.cleanup_time_slots_for_date_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete unbooked time slots that match the deleted availability
  DELETE FROM public.time_slots ts
  WHERE ts.lawyer_id = OLD.lawyer_id
    AND ts.is_booked = false
    AND ts.start_time::date = OLD.availability_date
    AND ts.start_time::time >= OLD.start_time
    AND ts.end_time::time <= OLD.end_time;
  
  RETURN OLD;
END;
$$;

-- Create trigger to cleanup slots when date availability is deleted
CREATE TRIGGER cleanup_slots_on_date_availability_delete
BEFORE DELETE ON public.lawyer_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_time_slots_for_date_availability();