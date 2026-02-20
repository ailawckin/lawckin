-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_views_lawyer_id ON public.profile_views(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON public.profile_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id) WHERE viewer_id IS NOT NULL;

-- Create view for aggregated stats (better performance than raw queries)
CREATE OR REPLACE VIEW public.lawyer_view_stats AS
SELECT 
  lawyer_id,
  COUNT(*) as total_views,
  COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') as views_last_7_days,
  COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '30 days') as views_last_30_days,
  COUNT(DISTINCT viewer_id) FILTER (WHERE viewer_id IS NOT NULL) as unique_viewers,
  MAX(viewed_at) as last_viewed_at
FROM public.profile_views
GROUP BY lawyer_id;

-- Create a view for daily view counts (last 30 days)
CREATE OR REPLACE VIEW public.lawyer_daily_views AS
SELECT 
  lawyer_id,
  DATE(viewed_at) as view_date,
  COUNT(*) as view_count
FROM public.profile_views
WHERE viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY lawyer_id, DATE(viewed_at)
ORDER BY lawyer_id, view_date DESC;