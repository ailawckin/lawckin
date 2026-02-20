-- Helper RPC to check calendar conflicts using local date/time and timezone
-- This makes it easier for frontend to check conflicts without timezone conversion
CREATE OR REPLACE FUNCTION public.check_calendar_conflicts_local(
  p_lawyer_id UUID,
  p_date DATE,
  p_start_time TIME WITHOUT TIME ZONE,
  p_end_time TIME WITHOUT TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz TEXT;
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ;
  y INT;
  m INT;
  d INT;
  sh INT;
  sm INT;
  eh INT;
  em INT;
BEGIN
  -- Get lawyer's timezone
  SELECT COALESCE(lp.timezone, 'America/New_York') INTO tz
  FROM public.lawyer_profiles lp
  WHERE lp.id = p_lawyer_id
  LIMIT 1;

  -- Extract date components
  y := EXTRACT(YEAR FROM p_date)::INT;
  m := EXTRACT(MONTH FROM p_date)::INT;
  d := EXTRACT(DAY FROM p_date)::INT;
  sh := EXTRACT(HOUR FROM p_start_time)::INT;
  sm := EXTRACT(MINUTE FROM p_start_time)::INT;
  eh := EXTRACT(HOUR FROM p_end_time)::INT;
  em := EXTRACT(MINUTE FROM p_end_time)::INT;

  -- Convert to UTC timestamps using lawyer's timezone
  start_ts := make_timestamptz(y, m, d, sh, sm, 0, tz);
  end_ts := make_timestamptz(y, m, d, eh, em, 0, tz);

  -- Check conflicts using existing function
  RETURN public.check_calendar_conflicts(p_lawyer_id, start_ts, end_ts);
END;
$$;

