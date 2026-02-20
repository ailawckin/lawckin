-- Restrict lawyer-initiated conversations to existing consultations
DO $$
BEGIN
  -- Remove permissive lawyer insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversations'
      AND policyname = 'Lawyers can create conversations'
  ) THEN
    DROP POLICY "Lawyers can create conversations" ON public.conversations;
  END IF;

  -- Allow lawyers to create conversations only with clients they consulted
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversations'
      AND policyname = 'Lawyers can create conversations with clients'
  ) THEN
    CREATE POLICY "Lawyers can create conversations with clients"
      ON public.conversations
      FOR INSERT
      WITH CHECK (
        lawyer_id IN (
          SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
        )
        AND EXISTS (
          SELECT 1 FROM public.consultations c
          WHERE c.client_id = client_id
            AND c.lawyer_id = lawyer_id
        )
      );
  END IF;
END $$;
