-- Create function to atomically book a time slot
CREATE OR REPLACE FUNCTION public.book_time_slot(
  p_slot_id uuid,
  p_client_id uuid,
  p_lawyer_id uuid,
  p_practice_area_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_slot RECORD;
  v_consultation_id uuid;
  v_start_time timestamptz;
  v_end_time timestamptz;
BEGIN
  -- Lock the time slot row for update
  SELECT * INTO v_slot
  FROM public.time_slots
  WHERE id = p_slot_id
  FOR UPDATE;
  
  -- Check if slot exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Time slot not found'
    );
  END IF;
  
  -- Check if slot is already booked
  IF v_slot.is_booked THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This time slot has already been booked by another client'
    );
  END IF;
  
  -- Verify the slot belongs to the correct lawyer
  IF v_slot.lawyer_id != p_lawyer_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid lawyer for this time slot'
    );
  END IF;
  
  v_start_time := v_slot.start_time;
  v_end_time := v_slot.end_time;
  
  -- Create the consultation
  INSERT INTO public.consultations (
    client_id,
    lawyer_id,
    practice_area_id,
    scheduled_at,
    duration_minutes,
    notes,
    status
  ) VALUES (
    p_client_id,
    p_lawyer_id,
    p_practice_area_id,
    v_start_time,
    EXTRACT(EPOCH FROM (v_end_time - v_start_time)) / 60,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_consultation_id;
  
  -- Mark the slot as booked
  UPDATE public.time_slots
  SET 
    is_booked = true,
    booking_id = v_consultation_id
  WHERE id = p_slot_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'consultation_id', v_consultation_id,
    'scheduled_at', v_start_time
  );
END;
$function$;