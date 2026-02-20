-- Fix timezone handling in time slot generation
DROP FUNCTION IF EXISTS public.generate_time_slots_from_date_availability() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_time_slots_from_date_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_slot_duration interval := '60 minutes';
BEGIN
  -- Delete existing unbooked slots for this lawyer on this date and time range
  DELETE FROM public.time_slots
  WHERE lawyer_id = NEW.lawyer_id
    AND is_booked = false
    AND start_time::date = NEW.availability_date
    AND start_time::time >= NEW.start_time
    AND end_time::time <= NEW.end_time;
  
  -- Generate time slots by combining date and time properly
  -- Convert date + time to timestamp and then to timestamptz in the session timezone
  v_slot_start := (NEW.availability_date + NEW.start_time)::timestamptz;
  
  WHILE v_slot_start < (NEW.availability_date + NEW.end_time)::timestamptz LOOP
    v_slot_end := v_slot_start + v_slot_duration;
    
    IF v_slot_end <= (NEW.availability_date + NEW.end_time)::timestamptz THEN
      INSERT INTO public.time_slots (lawyer_id, start_time, end_time)
      VALUES (NEW.lawyer_id, v_slot_start, v_slot_end)
      ON CONFLICT DO NOTHING;
    END IF;
    
    v_slot_start := v_slot_end;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER generate_slots_on_date_availability_insert
  AFTER INSERT ON public.lawyer_date_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_time_slots_from_date_availability();