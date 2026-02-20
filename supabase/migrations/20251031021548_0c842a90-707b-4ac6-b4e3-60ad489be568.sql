-- Fix security warnings by setting search_path on functions
ALTER FUNCTION public.generate_time_slots_for_availability(uuid, date, time, time, integer)
SET search_path TO 'public';

ALTER FUNCTION public.tg_after_insert_lawyer_date_availability()
SET search_path TO 'public';

ALTER FUNCTION public.tg_after_delete_lawyer_date_availability()
SET search_path TO 'public';

ALTER FUNCTION public.tg_after_update_lawyer_date_availability()
SET search_path TO 'public';