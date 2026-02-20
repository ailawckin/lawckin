-- Fix cancel_consultation function to avoid FOR UPDATE on outer join
DROP FUNCTION IF EXISTS public.cancel_consultation(uuid, uuid);

CREATE OR REPLACE FUNCTION public.cancel_consultation(p_consultation_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_consultation RECORD;
  v_lawyer_user_id uuid;
BEGIN
  -- Get consultation details with FOR UPDATE lock
  SELECT * INTO v_consultation
  FROM public.consultations
  WHERE id = p_consultation_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Consultation not found'
    );
  END IF;
  
  -- Get lawyer user_id separately (no lock needed)
  SELECT user_id INTO v_lawyer_user_id
  FROM public.lawyer_profiles
  WHERE id = v_consultation.lawyer_id;
  
  -- Verify user is client or lawyer
  IF v_consultation.client_id != p_user_id AND v_lawyer_user_id != p_user_id THEN
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
  
  -- Free the time slot using booking_id
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
$$;