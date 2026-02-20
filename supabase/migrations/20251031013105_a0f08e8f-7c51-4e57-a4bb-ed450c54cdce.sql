-- Step 1: Drop the old foreign key constraint FIRST (before updating data)
ALTER TABLE public.consultations 
DROP CONSTRAINT consultations_lawyer_id_fkey;

-- Step 2: Update existing consultations to use lawyer_profiles.id instead of auth.users.id
UPDATE public.consultations c
SET lawyer_id = lp.id
FROM public.lawyer_profiles lp
WHERE c.lawyer_id = lp.user_id;

-- Step 3: Add correct foreign key constraint pointing to lawyer_profiles
ALTER TABLE public.consultations 
ADD CONSTRAINT consultations_lawyer_id_fkey 
FOREIGN KEY (lawyer_id) 
REFERENCES public.lawyer_profiles(id) 
ON DELETE CASCADE;