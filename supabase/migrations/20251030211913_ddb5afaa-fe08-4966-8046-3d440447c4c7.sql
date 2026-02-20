-- Add timezone support to lawyer profiles
ALTER TABLE public.lawyer_profiles 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';

-- Add index for better performance on time slot queries
CREATE INDEX IF NOT EXISTS idx_time_slots_lawyer_date_booked 
ON public.time_slots(lawyer_id, start_time, is_booked);

-- Add unique constraint to prevent double booking at database level
ALTER TABLE public.consultations 
ADD CONSTRAINT unique_lawyer_scheduled_time 
UNIQUE (lawyer_id, scheduled_at);

-- Improve the book_time_slot function with better locking and validation
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
  v_has_conflict boolean;
BEGIN
  -- Lock the time slot row for update (prevents race conditions)
  SELECT * INTO v_slot
  FROM public.time_slots
  WHERE id = p_slot_id
  FOR UPDATE NOWAIT; -- Fail immediately if slot is locked by another transaction
  
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
  
  -- Check for calendar conflicts using existing function
  SELECT public.check_calendar_conflicts(
    p_lawyer_id,
    v_start_time,
    v_end_time
  ) INTO v_has_conflict;
  
  IF v_has_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This time conflicts with the lawyer''s calendar'
    );
  END IF;
  
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
EXCEPTION
  WHEN lock_not_available THEN
    -- Another transaction is booking this slot
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This time slot is currently being booked by another client. Please try a different time.'
    );
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A consultation is already scheduled at this time'
    );
END;
$function$;

-- Add function to cancel consultation and free time slot atomically
CREATE OR REPLACE FUNCTION public.cancel_consultation(
  p_consultation_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_consultation RECORD;
BEGIN
  -- Get consultation details and verify user can cancel it
  SELECT c.*, lp.user_id as lawyer_user_id
  INTO v_consultation
  FROM public.consultations c
  LEFT JOIN public.lawyer_profiles lp ON lp.id = c.lawyer_id
  WHERE c.id = p_consultation_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Consultation not found'
    );
  END IF;
  
  -- Verify user is client or lawyer
  IF v_consultation.client_id != p_user_id AND v_consultation.lawyer_user_id != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You do not have permission to cancel this consultation'
    );
  END IF;
  
  -- Check if already cancelled
  IF v_consultation.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This consultation is already cancelled'
    );
  END IF;
  
  -- Update consultation status
  UPDATE public.consultations
  SET status = 'cancelled'
  WHERE id = p_consultation_id;
  
  -- Free the time slot using booking_id (much more reliable than time range)
  UPDATE public.time_slots
  SET 
    is_booked = false,
    booking_id = null
  WHERE booking_id = p_consultation_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'consultation_id', p_consultation_id
  );
END;
$function$;