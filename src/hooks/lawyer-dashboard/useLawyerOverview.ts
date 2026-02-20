import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OVERVIEW_POLL_MS } from "@/components/lawyer/dashboard/constants";

interface UseLawyerOverviewArgs {
  userId: string | null;
  lawyerProfileId: string | null;
  activeTab: string;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

const getOverviewStorageKey = (userId: string | null) =>
  userId ? `lawyerOverviewScheduleRange:${userId}` : "lawyerOverviewScheduleRange:anonymous";

export const useLawyerOverview = ({
  userId,
  lawyerProfileId,
  activeTab,
  toast,
}: UseLawyerOverviewArgs) => {
  const [profileViews, setProfileViews] = useState(0);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [profileViewsLoading, setProfileViewsLoading] = useState(false);
  const [profileViewsError, setProfileViewsError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [lastOverviewRefreshAt, setLastOverviewRefreshAt] = useState<Date | null>(null);
  const [lastOverviewRefreshFailedAt, setLastOverviewRefreshFailedAt] = useState<Date | null>(null);
  const [overviewRefreshing, setOverviewRefreshing] = useState(false);
  const [overviewScheduleRange, setOverviewScheduleRange] = useState<"today" | "week">("today");
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const fetchProfileViews = useCallback(async (lawyerId: string) => {
    if (!lawyerId) return false;
    setProfileViewsLoading(true);
    setProfileViewsError("");
    try {
      const { count, error } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("lawyer_id", lawyerId);
      if (error) throw error;
      setProfileViews(count || 0);
      return true;
    } catch (error: any) {
      setProfileViews(0);
      setProfileViewsError(error.message || "Failed to load profile views.");
      toast({
        title: "Failed to load profile views",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setProfileViewsLoading(false);
    }
  }, [toast]);

  const fetchAvailability = useCallback(async (lawyerId: string) => {
    if (!lawyerId) return false;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("lawyer_id", lawyerId)
        .eq("is_booked", false)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time", { ascending: true });
      if (error) throw error;

      setAvailableSlots(data || []);
      return true;
    } catch (error: any) {
      setAvailableSlots([]);
      setAvailabilityError(error.message || "Failed to load availability.");
      toast({
        title: "Failed to load availability",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setAvailabilityLoading(false);
    }
  }, [toast]);

  const refreshOverviewStats = useCallback(async (lawyerId: string) => {
    if (!lawyerId) return;
    setOverviewRefreshing(true);
    try {
      const [viewsOk, availabilityOk] = await Promise.all([
        fetchProfileViews(lawyerId),
        fetchAvailability(lawyerId),
      ]);
      if (viewsOk && availabilityOk) {
        setLastOverviewRefreshAt(new Date());
        setLastOverviewRefreshFailedAt(null);
      } else {
        setLastOverviewRefreshFailedAt(new Date());
      }
    } finally {
      setOverviewRefreshing(false);
    }
  }, [fetchAvailability, fetchProfileViews]);

  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    const handleVisibility = () => setIsWindowFocused(document.visibilityState === "visible");
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(getOverviewStorageKey(userId));
    if (stored === "week") {
      setOverviewScheduleRange("week");
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getOverviewStorageKey(userId), overviewScheduleRange);
  }, [overviewScheduleRange, userId]);

  useEffect(() => {
    if (!userId || !lawyerProfileId) return;
    refreshOverviewStats(lawyerProfileId);
  }, [userId, lawyerProfileId, refreshOverviewStats]);

  useEffect(() => {
    if (activeTab !== "overview" || !lawyerProfileId) return;
    refreshOverviewStats(lawyerProfileId);
  }, [activeTab, lawyerProfileId, refreshOverviewStats]);

  useEffect(() => {
    if (activeTab !== "overview" || !lawyerProfileId || !isWindowFocused) return;
    const intervalId = window.setInterval(() => {
      refreshOverviewStats(lawyerProfileId);
    }, OVERVIEW_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [activeTab, lawyerProfileId, isWindowFocused, refreshOverviewStats]);

  useEffect(() => {
    if (!isWindowFocused || activeTab !== "overview" || !lawyerProfileId) return;
    refreshOverviewStats(lawyerProfileId);
  }, [isWindowFocused, activeTab, lawyerProfileId, refreshOverviewStats]);

  useEffect(() => {
    if (!lawyerProfileId) return;
    const channel = supabase
      .channel(`lawyer-availability-${lawyerProfileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_slots", filter: `lawyer_id=eq.${lawyerProfileId}` },
        async () => {
          await refreshOverviewStats(lawyerProfileId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lawyerProfileId, refreshOverviewStats]);

  return {
    profileViews,
    availableSlots,
    profileViewsLoading,
    profileViewsError,
    availabilityLoading,
    availabilityError,
    lastOverviewRefreshAt,
    lastOverviewRefreshFailedAt,
    overviewRefreshing,
    overviewScheduleRange,
    setOverviewScheduleRange,
    refreshOverviewStats,
  };
};

export default useLawyerOverview;
