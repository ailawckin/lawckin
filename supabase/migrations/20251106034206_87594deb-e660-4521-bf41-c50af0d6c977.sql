-- Create lawyer_reviews table for storing client reviews and ratings
CREATE TABLE public.lawyer_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(consultation_id)
);

-- Enable RLS
ALTER TABLE public.lawyer_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lawyer_reviews
CREATE POLICY "Anyone can view reviews"
  ON public.lawyer_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Clients can create reviews for their consultations"
  ON public.lawyer_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id 
    AND EXISTS (
      SELECT 1 FROM public.consultations 
      WHERE id = consultation_id 
      AND client_id = auth.uid()
      AND status = 'completed'
    )
  );

CREATE POLICY "Clients can update their own reviews"
  ON public.lawyer_reviews
  FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own reviews"
  ON public.lawyer_reviews
  FOR DELETE
  USING (auth.uid() = client_id);

-- Create index for faster queries
CREATE INDEX idx_lawyer_reviews_lawyer_id ON public.lawyer_reviews(lawyer_id);
CREATE INDEX idx_lawyer_reviews_client_id ON public.lawyer_reviews(client_id);
CREATE INDEX idx_lawyer_reviews_created_at ON public.lawyer_reviews(created_at DESC);

-- Create trigger to update lawyer rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_lawyer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lawyer_id UUID;
  v_avg_rating NUMERIC;
  v_review_count INTEGER;
BEGIN
  -- Get lawyer_id from the affected row
  IF TG_OP = 'DELETE' THEN
    v_lawyer_id := OLD.lawyer_id;
  ELSE
    v_lawyer_id := NEW.lawyer_id;
  END IF;

  -- Calculate new average rating and count
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM public.lawyer_reviews
  WHERE lawyer_id = v_lawyer_id;

  -- Update lawyer profile
  UPDATE public.lawyer_profiles
  SET 
    rating = ROUND(v_avg_rating, 1),
    total_reviews = v_review_count,
    updated_at = now()
  WHERE id = v_lawyer_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for rating updates
CREATE TRIGGER update_lawyer_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.lawyer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lawyer_rating();

-- Add updated_at trigger
CREATE TRIGGER update_lawyer_reviews_updated_at
  BEFORE UPDATE ON public.lawyer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create conversations table for messaging
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, lawyer_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid() = client_id 
    OR lawyer_id IN (
      SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create conversations with lawyers"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Create index for faster queries
CREATE INDEX idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX idx_conversations_lawyer_id ON public.conversations(lawyer_id);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE client_id = auth.uid() 
      OR lawyer_id IN (
        SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE client_id = auth.uid() 
      OR lawyer_id IN (
        SELECT id FROM public.lawyer_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- Create indexes for faster queries
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to update conversation updated_at when message is added
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;