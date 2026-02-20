-- Block lawyer accounts from booking consultations

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
  -- Disallow lawyer accounts from booking consultations
  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_client_id
      AND role = 'lawyer'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Lawyer accounts cannot book consultations. Please use a client account.'
    );
  END IF;

  -- Lock the time slot row for update (prevents race conditions)
  SELECT * INTO v_slot
  FROM public.time_slots
  WHERE id = p_slot_id
  FOR UPDATE NOWAIT;

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

  -- Create the consultation with time_slot_id
  INSERT INTO public.consultations (
    client_id,
    lawyer_id,
    practice_area_id,
    scheduled_at,
    duration_minutes,
    notes,
    status,
    time_slot_id
  ) VALUES (
    p_client_id,
    p_lawyer_id,
    p_practice_area_id,
    v_start_time,
    EXTRACT(EPOCH FROM (v_end_time - v_start_time)) / 60,
    p_notes,
    'pending',
    p_slot_id
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
