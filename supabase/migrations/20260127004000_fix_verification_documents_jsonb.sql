-- Fix verification_documents conversion without USING subquery
DO $$
BEGIN
  -- Ensure rejection reason column exists
  ALTER TABLE public.lawyer_profiles
  ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT;

  -- Only convert if verification_documents is still a text[] column
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lawyer_profiles'
      AND column_name = 'verification_documents'
      AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.lawyer_profiles
    ADD COLUMN IF NOT EXISTS verification_documents_jsonb JSONB;

    UPDATE public.lawyer_profiles
    SET verification_documents_jsonb = COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', gen_random_uuid(),
            'type', 'other',
            'url', doc_url,
            'uploaded_at', now(),
            'file_name', null,
            'file_size', null
          )
        )
        FROM unnest(verification_documents) AS doc_url
      ),
      '[]'::jsonb
    );

    ALTER TABLE public.lawyer_profiles
    DROP COLUMN verification_documents;

    ALTER TABLE public.lawyer_profiles
    RENAME COLUMN verification_documents_jsonb TO verification_documents;
  END IF;
END $$;
