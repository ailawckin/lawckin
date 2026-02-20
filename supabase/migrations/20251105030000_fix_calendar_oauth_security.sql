-- Create table to store OAuth nonces for state validation
CREATE TABLE IF NOT EXISTS public.oauth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL UNIQUE,
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast nonce lookups
CREATE INDEX IF NOT EXISTS idx_oauth_nonces_nonce ON public.oauth_nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_oauth_nonces_expires ON public.oauth_nonces(expires_at);

-- Enable RLS
ALTER TABLE public.oauth_nonces ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can manage nonces (edge functions)
CREATE POLICY "Service role can manage nonces"
  ON public.oauth_nonces FOR ALL
  USING (true);

-- Function to clean up expired nonces
CREATE OR REPLACE FUNCTION public.cleanup_expired_nonces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.oauth_nonces
  WHERE expires_at < now();
END;
$$;

-- Add a function to validate and consume nonce
CREATE OR REPLACE FUNCTION public.validate_oauth_nonce(
  p_nonce TEXT,
  p_lawyer_id UUID
)
RETURNS UUID -- returns user_id if valid, NULL if invalid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_stored_lawyer_id UUID;
BEGIN
  -- Get nonce record
  SELECT user_id, lawyer_id INTO v_user_id, v_stored_lawyer_id
  FROM public.oauth_nonces
  WHERE nonce = p_nonce
    AND expires_at > now();
  
  -- If nonce not found or expired
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verify lawyer_id matches
  IF v_stored_lawyer_id != p_lawyer_id THEN
    RETURN NULL;
  END IF;
  
  -- Delete nonce (one-time use)
  DELETE FROM public.oauth_nonces WHERE nonce = p_nonce;
  
  RETURN v_user_id;
END;
$$;

