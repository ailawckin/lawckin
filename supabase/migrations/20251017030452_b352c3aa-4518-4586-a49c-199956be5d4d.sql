-- First, delete duplicate time slots, keeping only the most recent one
DELETE FROM public.time_slots ts1
WHERE EXISTS (
  SELECT 1 FROM public.time_slots ts2
  WHERE ts1.lawyer_id = ts2.lawyer_id
    AND ts1.start_time = ts2.start_time
    AND ts1.end_time = ts2.end_time
    AND ts1.created_at < ts2.created_at
);

-- Now drop and recreate the time slot generation function with proper timezone handling
DROP FUNCTION IF EXISTS public.generate_time_slots_for_lawyer(uuid, date, date, integer);

CREATE OR REPLACE FUNCTION public.generate_time_slots_for_lawyer(
  p_lawyer_id uuid,
  p_start_date date,
  p_end_date date,
  p_slot_duration_minutes integer DEFAULT 60
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_date DATE;
  v_day_of_week INTEGER;
  v_slot_count INTEGER := 0;
  v_slot_start TIMESTAMP WITH TIME ZONE;
  v_slot_end TIMESTAMP WITH TIME ZONE;
  v_availability RECORD;
  v_override RECORD;
  v_base_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  v_current_date := p_start_date;
  
  -- First, delete any existing unbooked slots for this lawyer in the date range
  DELETE FROM public.time_slots
  WHERE lawyer_id = p_lawyer_id
    AND is_booked = false
    AND start_time::date BETWEEN p_start_date AND p_end_date;
  
  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date);
    
    -- Create base timestamp for the current date at midnight
    v_base_timestamp := v_current_date::timestamp with time zone;
    
    -- Check for override first
    SELECT * INTO v_override
    FROM public.availability_overrides
    WHERE lawyer_id = p_lawyer_id
      AND override_date = v_current_date
    LIMIT 1;
    
    IF FOUND THEN
      IF v_override.is_available AND v_override.start_time IS NOT NULL THEN
        -- Create slots for override times
        v_slot_start := v_base_timestamp + v_override.start_time;
        
        WHILE v_slot_start < v_base_timestamp + v_override.end_time LOOP
          v_slot_end := v_slot_start + (p_slot_duration_minutes || ' minutes')::INTERVAL;
          
          IF v_slot_end <= v_base_timestamp + v_override.end_time THEN
            INSERT INTO public.time_slots (lawyer_id, start_time, end_time)
            VALUES (p_lawyer_id, v_slot_start, v_slot_end)
            ON CONFLICT DO NOTHING;
            v_slot_count := v_slot_count + 1;
          END IF;
          
          v_slot_start := v_slot_end;
        END LOOP;
      END IF;
    ELSE
      -- Use recurring availability - eliminate duplicates
      FOR v_availability IN
        SELECT DISTINCT ON (start_time, end_time) *
        FROM public.recurring_availability
        WHERE lawyer_id = p_lawyer_id
          AND day_of_week = v_day_of_week
        ORDER BY start_time, end_time, created_at DESC
      LOOP
        v_slot_start := v_base_timestamp + v_availability.start_time;
        
        WHILE v_slot_start < v_base_timestamp + v_availability.end_time LOOP
          v_slot_end := v_slot_start + (p_slot_duration_minutes || ' minutes')::INTERVAL;
          
          IF v_slot_end <= v_base_timestamp + v_availability.end_time THEN
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
$function$;

-- Add unique constraint to prevent duplicate time slots
ALTER TABLE public.time_slots
ADD CONSTRAINT time_slots_lawyer_time_unique
UNIQUE (lawyer_id, start_time, end_time);

-- Function to clean up time slots when availability is removed
CREATE OR REPLACE FUNCTION public.cleanup_time_slots_for_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete unbooked time slots that match the deleted availability
  DELETE FROM public.time_slots ts
  WHERE ts.lawyer_id = OLD.lawyer_id
    AND ts.is_booked = false
    AND EXTRACT(DOW FROM ts.start_time) = OLD.day_of_week
    AND ts.start_time::time >= OLD.start_time
    AND ts.end_time::time <= OLD.end_time;
  
  RETURN OLD;
END;
$function$;

-- Trigger to clean up slots when availability is deleted
DROP TRIGGER IF EXISTS cleanup_slots_on_availability_delete ON public.recurring_availability;

CREATE TRIGGER cleanup_slots_on_availability_delete
AFTER DELETE ON public.recurring_availability
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_time_slots_for_availability();

-- Function to regenerate time slots when availability is added or updated
CREATE OR REPLACE FUNCTION public.regenerate_time_slots_for_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_end_date DATE;
BEGIN
  -- Generate slots for the next 90 days
  v_end_date := CURRENT_DATE + INTERVAL '90 days';
  
  -- Call the generation function
  PERFORM public.generate_time_slots_for_lawyer(
    NEW.lawyer_id,
    CURRENT_DATE,
    v_end_date::date,
    60
  );
  
  RETURN NEW;
END;
$function$;

-- Trigger to regenerate slots when availability is added or updated
DROP TRIGGER IF EXISTS regenerate_slots_on_availability_change ON public.recurring_availability;

CREATE TRIGGER regenerate_slots_on_availability_change
AFTER INSERT OR UPDATE ON public.recurring_availability
FOR EACH ROW
EXECUTE FUNCTION public.regenerate_time_slots_for_availability();