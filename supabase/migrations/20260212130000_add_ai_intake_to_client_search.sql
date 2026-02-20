-- Extend client_search with AI intake metadata

ALTER TABLE public.client_search
  ADD COLUMN IF NOT EXISTS specific_issue TEXT,
  ADD COLUMN IF NOT EXISTS intake_mode TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS ai_output JSONB,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS ai_practice_area TEXT,
  ADD COLUMN IF NOT EXISTS ai_specific_issue TEXT;

-- Helpful index for analytics by practice area
CREATE INDEX IF NOT EXISTS idx_client_search_practice_area ON public.client_search (practice_area);
