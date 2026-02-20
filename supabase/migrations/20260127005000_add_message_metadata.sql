-- Add message metadata fields for previews and attachments
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS last_message_sender_id UUID REFERENCES auth.users(id);

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Update trigger to keep conversation metadata in sync
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now(),
      last_message_at = NEW.created_at,
      last_message_preview = CASE
        WHEN NEW.content IS NOT NULL AND NEW.content <> '' THEN LEFT(NEW.content, 200)
        WHEN NEW.attachment_url IS NOT NULL THEN 'Attachment'
        ELSE ''
      END,
      last_message_sender_id = NEW.sender_id
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
