-- Create enum for calendar providers
CREATE TYPE calendar_provider AS ENUM ('google', 'microsoft');

-- Create enum for calendar connection status
CREATE TYPE calendar_connection_status AS ENUM ('active', 'expired', 'revoked', 'error');

-- Table to store calendar connections (OAuth tokens)
CREATE TABLE public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  provider_account_id TEXT NOT NULL, -- email or unique ID from provider
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status calendar_connection_status DEFAULT 'active',
  scopes TEXT[], -- OAuth scopes granted
  calendar_id TEXT, -- primary calendar ID (e.g., "primary" for Google)
  calendar_name TEXT,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(lawyer_id, provider, provider_account_id)
);

-- Table to cache free/busy data from external calendars
CREATE TABLE public.calendar_events_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL, -- external event ID
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ NOT NULL,
  is_busy BOOLEAN DEFAULT true NOT NULL, -- false for transparent/free events
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(connection_id, event_id)
);

-- Index for fast availability queries
CREATE INDEX idx_calendar_events_cache_time_range 
  ON public.calendar_events_cache(connection_id, event_start, event_end) 
  WHERE is_busy = true;

-- Table to log sync operations
CREATE TABLE public.calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'manual', 'scheduled', 'realtime'
  sync_start TIMESTAMPTZ NOT NULL,
  sync_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL, -- 'success', 'partial', 'failed'
  events_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_connections
CREATE POLICY "Lawyers can view their own calendar connections"
  ON public.calendar_connections FOR SELECT
  USING (
    lawyer_id IN (
      SELECT id FROM public.lawyer_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers can manage their own calendar connections"
  ON public.calendar_connections FOR ALL
  USING (
    lawyer_id IN (
      SELECT id FROM public.lawyer_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for calendar_events_cache
CREATE POLICY "Lawyers can view their cached calendar events"
  ON public.calendar_events_cache FOR SELECT
  USING (
    connection_id IN (
      SELECT cc.id FROM public.calendar_connections cc
      JOIN public.lawyer_profiles lp ON lp.id = cc.lawyer_id
      WHERE lp.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage calendar cache"
  ON public.calendar_events_cache FOR ALL
  USING (true);

-- RLS Policies for calendar_sync_log
CREATE POLICY "Lawyers can view their sync logs"
  ON public.calendar_sync_log FOR SELECT
  USING (
    connection_id IN (
      SELECT cc.id FROM public.calendar_connections cc
      JOIN public.lawyer_profiles lp ON lp.id = cc.lawyer_id
      WHERE lp.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if a time slot conflicts with calendar events
CREATE OR REPLACE FUNCTION public.check_calendar_conflicts(
  p_lawyer_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_conflict BOOLEAN;
BEGIN
  -- Check if there are any busy events in the cached calendar data
  SELECT EXISTS(
    SELECT 1
    FROM public.calendar_events_cache cec
    JOIN public.calendar_connections cc ON cc.id = cec.connection_id
    WHERE cc.lawyer_id = p_lawyer_id
      AND cc.status = 'active'
      AND cec.is_busy = true
      AND (
        -- Event overlaps with requested time range
        (cec.event_start < p_end_time AND cec.event_end > p_start_time)
      )
  ) INTO v_has_conflict;
  
  RETURN v_has_conflict;
END;
$$;