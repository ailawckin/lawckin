-- Create message attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Message attachments readable by participants'
  ) THEN
    CREATE POLICY "Message attachments readable by participants"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'message-attachments'
        AND EXISTS (
          SELECT 1
          FROM public.conversations c
          LEFT JOIN public.lawyer_profiles lp ON lp.id = c.lawyer_id
          WHERE c.id::text = (storage.foldername(name))[1]
            AND (c.client_id = auth.uid() OR lp.user_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Message attachments insert by participants'
  ) THEN
    CREATE POLICY "Message attachments insert by participants"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'message-attachments'
        AND EXISTS (
          SELECT 1
          FROM public.conversations c
          LEFT JOIN public.lawyer_profiles lp ON lp.id = c.lawyer_id
          WHERE c.id::text = (storage.foldername(name))[1]
            AND (c.client_id = auth.uid() OR lp.user_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Message attachments update by participants'
  ) THEN
    CREATE POLICY "Message attachments update by participants"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'message-attachments'
        AND EXISTS (
          SELECT 1
          FROM public.conversations c
          LEFT JOIN public.lawyer_profiles lp ON lp.id = c.lawyer_id
          WHERE c.id::text = (storage.foldername(name))[1]
            AND (c.client_id = auth.uid() OR lp.user_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Message attachments delete by participants'
  ) THEN
    CREATE POLICY "Message attachments delete by participants"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'message-attachments'
        AND EXISTS (
          SELECT 1
          FROM public.conversations c
          LEFT JOIN public.lawyer_profiles lp ON lp.id = c.lawyer_id
          WHERE c.id::text = (storage.foldername(name))[1]
            AND (c.client_id = auth.uid() OR lp.user_id = auth.uid())
        )
      );
  END IF;
END $$;
