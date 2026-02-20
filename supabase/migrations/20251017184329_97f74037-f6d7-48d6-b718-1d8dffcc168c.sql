-- Regenerate all existing time slots from lawyer_date_availability with correct timezone handling
DO $$
DECLARE
  v_availability RECORD;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_slot_duration interval := '60 minutes';
BEGIN
  -- Delete all unbooked time slots
  DELETE FROM public.time_slots WHERE is_booked = false;
  
  -- Regenerate time slots for all existing availability entries
  FOR v_availability IN 
    SELECT * FROM public.lawyer_date_availability
  LOOP
    v_slot_start := (v_availability.availability_date + v_availability.start_time)::timestamptz;
    
    WHILE v_slot_start < (v_availability.availability_date + v_availability.end_time)::timestamptz LOOP
      v_slot_end := v_slot_start + v_slot_duration;
      
      IF v_slot_end <= (v_availability.availability_date + v_availability.end_time)::timestamptz THEN
        INSERT INTO public.time_slots (lawyer_id, start_time, end_time)
        VALUES (v_availability.lawyer_id, v_slot_start, v_slot_end)
        ON CONFLICT DO NOTHING;
      END IF;
      
      v_slot_start := v_slot_end;
    END LOOP;
  END LOOP;
END $$;