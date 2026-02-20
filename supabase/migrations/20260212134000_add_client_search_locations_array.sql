-- Store multiple selected locations for client searches

ALTER TABLE public.client_search
  ADD COLUMN IF NOT EXISTS ny_locations TEXT[];
