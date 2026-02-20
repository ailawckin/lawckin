-- Allow participants to delete conversations (and cascade messages)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversations'
      AND policyname = 'Participants can delete conversations'
  ) THEN
    CREATE POLICY "Participants can delete conversations"
      ON public.conversations
      FOR DELETE
      USING (
        auth.uid() = client_id
        OR lawyer_id IN (
          SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
