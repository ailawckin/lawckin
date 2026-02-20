-- Fix RLS policy for lawyers to view their consultations
-- The issue: lawyer_id is the lawyer_profile.id, not the user_id
-- We need to join through lawyer_profiles to check the user's auth.uid()

DROP POLICY IF EXISTS "Users can view their own consultations" ON public.consultations;

CREATE POLICY "Users can view their own consultations" 
ON public.consultations 
FOR SELECT 
USING (
  -- Client can see their own consultations
  auth.uid() = client_id 
  OR 
  -- Lawyer can see their consultations (join through lawyer_profiles)
  lawyer_id IN (
    SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
  )
);