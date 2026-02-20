CREATE OR REPLACE FUNCTION public.reschedule_consultation(
  p_consultation_id uuid,
  p_user_id uuid,
  p_new_slot_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_consultation record;
  v_lawyer_user_id uuid;
  v_slot record;
BEGIN
  SELECT * INTO v_consultation
  FROM public.consultations
  WHERE id = p_consultation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Consultation not found');
  END IF;

  SELECT user_id INTO v_lawyer_user_id
  FROM public.lawyer_profiles
  WHERE id = v_consultation.lawyer_id;

  IF v_consultation.client_id != p_user_id AND v_lawyer_user_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You do not have permission to reschedule');
  END IF;

  SELECT * INTO v_slot
  FROM public.time_slots
  WHERE id = p_new_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selected time slot not found');
  END IF;

  IF v_slot.is_booked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selected time slot is already booked');
  END IF;

  IF v_slot.lawyer_id != v_consultation.lawyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Time slot does not belong to this lawyer');
  END IF;

  IF public.check_calendar_conflicts(v_slot.lawyer_id, v_slot.start_time, v_slot.end_time) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Time slot conflicts with calendar');
  END IF;

  UPDATE public.time_slots
  SET is_booked = false,
      booking_id = null
  WHERE booking_id = p_consultation_id;

  UPDATE public.time_slots
  SET is_booked = true,
      booking_id = p_consultation_id
  WHERE id = p_new_slot_id;

  UPDATE public.consultations
  SET scheduled_at = v_slot.start_time,
      time_slot_id = v_slot.id,
      status = 'confirmed'
  WHERE id = p_consultation_id;

  RETURN jsonb_build_object(
    'success', true,
    'consultation_id', p_consultation_id,
    'scheduled_at', v_slot.start_time
  );
END;
$$;
