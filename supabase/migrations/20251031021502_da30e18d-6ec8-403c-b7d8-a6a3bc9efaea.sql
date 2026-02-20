-- Drop old unused functions that have been replaced
DROP FUNCTION IF EXISTS public.cleanup_time_slots_for_availability() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_time_slots_for_date_availability() CASCADE;
DROP FUNCTION IF EXISTS public.generate_time_slots_from_date_availability() CASCADE;
DROP FUNCTION IF EXISTS public.regenerate_time_slots_for_availability() CASCADE;
DROP FUNCTION IF EXISTS public.generate_time_slots_for_lawyer(uuid, date, date, integer) CASCADE;

-- Ensure triggers are properly created on lawyer_date_availability table
DROP TRIGGER IF EXISTS trg_after_insert_lawyer_date_availability ON public.lawyer_date_availability;
CREATE TRIGGER trg_after_insert_lawyer_date_availability
AFTER INSERT ON public.lawyer_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.tg_after_insert_lawyer_date_availability();

DROP TRIGGER IF EXISTS trg_after_delete_lawyer_date_availability ON public.lawyer_date_availability;
CREATE TRIGGER trg_after_delete_lawyer_date_availability
AFTER DELETE ON public.lawyer_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.tg_after_delete_lawyer_date_availability();

DROP TRIGGER IF EXISTS trg_after_update_lawyer_date_availability ON public.lawyer_date_availability;
CREATE TRIGGER trg_after_update_lawyer_date_availability
AFTER UPDATE ON public.lawyer_date_availability
FOR EACH ROW
EXECUTE FUNCTION public.tg_after_update_lawyer_date_availability();