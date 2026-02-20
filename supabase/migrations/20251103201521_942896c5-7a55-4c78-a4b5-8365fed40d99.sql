-- Fix UPDATE policy for consultations to allow lawyers to update
DROP POLICY IF EXISTS "Clients and lawyers can update their consultations" ON public.consultations;

CREATE POLICY "Clients and lawyers can update their consultations" 
ON public.consultations 
FOR UPDATE 
USING (
  -- Client can update their own consultations
  auth.uid() = client_id 
  OR 
  -- Lawyer can update their consultations (join through lawyer_profiles)
  lawyer_id IN (
    SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
  )
);