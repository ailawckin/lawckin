import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileViewStats {
  total_views: number;
  views_last_7_days: number;
  views_last_30_days: number;
  unique_viewers: number;
  last_viewed_at: string | null;
}

export interface DailyView {
  view_date: string;
  view_count: number;
}

export interface RecentViewer {
  viewer_id: string;
  viewed_at: string;
  full_name: string;
  avatar_url: string | null;
}

export const useProfileViews = (lawyerId: string | null) => {
  const [stats, setStats] = useState<ProfileViewStats | null>(null);
  const [dailyViews, setDailyViews] = useState<DailyView[]>([]);
  const [recentViewers, setRecentViewers] = useState<RecentViewer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lawyerId) {
      fetchViewStats();
    }
  }, [lawyerId]);

  const fetchViewStats = async () => {
    if (!lawyerId) return;
    
    setLoading(true);

    try {
      // Fetch aggregated stats
      const { data: statsData, error: statsError } = await supabase
        .from("lawyer_view_stats")
        .select("*")
        .eq("lawyer_id", lawyerId)
        .single();

      if (!statsError && statsData) {
        setStats(statsData);
      } else {
        // If no views yet, set default stats
        setStats({
          total_views: 0,
          views_last_7_days: 0,
          views_last_30_days: 0,
          unique_viewers: 0,
          last_viewed_at: null,
        });
      }

      // Fetch daily views for chart
      const { data: dailyData, error: dailyError } = await supabase
        .from("lawyer_daily_views")
        .select("*")
        .eq("lawyer_id", lawyerId)
        .order("view_date", { ascending: false })
        .limit(30);

      if (!dailyError && dailyData) {
        setDailyViews(dailyData);
      }

      // Fetch recent authenticated viewers
      const { data: viewersData, error: viewersError } = await supabase
        .from("profile_views")
        .select(`
          viewer_id,
          viewed_at,
          profiles!profile_views_viewer_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("lawyer_id", lawyerId)
        .not("viewer_id", "is", null)
        .order("viewed_at", { ascending: false })
        .limit(10);

      if (!viewersError && viewersData) {
        const formattedViewers = viewersData.map((view: any) => ({
          viewer_id: view.viewer_id,
          viewed_at: view.viewed_at,
          full_name: view.profiles?.full_name || "Unknown User",
          avatar_url: view.profiles?.avatar_url || null,
        }));
        setRecentViewers(formattedViewers);
      }
    } catch (error) {
      console.error("Error fetching profile view stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    dailyViews,
    recentViewers,
    loading,
    refetch: fetchViewStats,
  };
};
