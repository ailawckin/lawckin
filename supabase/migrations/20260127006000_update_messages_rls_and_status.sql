-- Allow lawyers to create conversations and update message status
DO $$
BEGIN
  -- Conversations: allow lawyers to create
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversations'
      AND policyname = 'Lawyers can create conversations'
  ) THEN
    CREATE POLICY "Lawyers can create conversations"
      ON public.conversations
      FOR INSERT
      WITH CHECK (
        lawyer_id IN (
          SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Messages: allow participants to mark messages as read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Participants can update message status'
  ) THEN
    CREATE POLICY "Participants can update message status"
      ON public.messages
      FOR UPDATE
      USING (
        conversation_id IN (
          SELECT id FROM public.conversations
          WHERE client_id = auth.uid()
             OR lawyer_id IN (
               SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
             )
        )
      )
      WITH CHECK (
        conversation_id IN (
          SELECT id FROM public.conversations
          WHERE client_id = auth.uid()
             OR lawyer_id IN (
               SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
             )
        )
      );
  END IF;
END $$;

-- Add status timestamps for delivery/read
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Mark messages as delivered on insert
CREATE OR REPLACE FUNCTION public.mark_message_delivered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET status = 'delivered',
      delivered_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_message_delivered ON public.messages;
CREATE TRIGGER mark_message_delivered
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_message_delivered();
