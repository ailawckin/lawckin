import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { isToday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { getLawyerStorageKey } from "@/components/lawyer/dashboard/storage";
import {
  VALID_DATE_RANGE_FILTERS,
  VALID_STATUS_FILTERS,
} from "@/components/lawyer/dashboard/constants";
import type { ProfileSummary } from "@/components/lawyer/dashboard/types";

interface UseLawyerConsultationsArgs {
  userId: string | null;
  lawyerProfile: any | null;
  profile: ProfileSummary | null;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
  fetchLawyerConsultations: (userId: string) => Promise<any>;
  cancelConsultationHandler: (
    consultation: any,
    userId: string,
    profile: ProfileSummary | null,
    role: "lawyer"
  ) => Promise<{ success: boolean }>;
  refreshOverviewStats: (lawyerId: string) => Promise<void> | void;
}

export const useLawyerConsultations = ({
  userId,
  lawyerProfile,
  profile,
  toast,
  fetchLawyerConsultations,
  cancelConsultationHandler,
  refreshOverviewStats,
}: UseLawyerConsultationsArgs) => {
  const [upcomingConsultations, setUpcomingConsultations] = useState<any[]>([]);
  const [pastConsultations, setPastConsultations] = useState<any[]>([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [practiceAreaFilter, setPracticeAreaFilter] = useState("all");

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [consultationToCancel, setConsultationToCancel] = useState<any>(null);

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [consultationToReschedule, setConsultationToReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [rescheduleSlotId, setRescheduleSlotId] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const fetchConsultations = async (id: string) => {
    setConsultationsLoading(true);
    try {
      const result = await fetchLawyerConsultations(id);

      if (result && typeof result === "object" && "upcoming" in result) {
        setUpcomingConsultations(result.upcoming || []);
        setPastConsultations(result.past || []);
      } else {
        const consultations = Array.isArray(result) ? result : [];
        const now = new Date();

        const upcoming = consultations
          .filter((c: any) => new Date(c.scheduled_at) > now && c.status !== "cancelled")
          .sort((a: any, b: any) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          );

        const past = consultations
          .filter(
            (c: any) =>
              new Date(c.scheduled_at) <= now || c.status === "completed" || c.status === "cancelled"
          )
          .sort((a: any, b: any) =>
            new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
          );

        setUpcomingConsultations(upcoming);
        setPastConsultations(past);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load consultations",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setUpcomingConsultations([]);
      setPastConsultations([]);
    } finally {
      setConsultationsLoading(false);
    }
  };

  const getDateRangeStart = () => {
    const now = new Date();
    if (dateRangeFilter === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }
    if (dateRangeFilter === "month") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return start;
    }
    if (dateRangeFilter === "30days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return start;
    }
    return null;
  };

  const filterConsultations = (items: any[]) => {
    const rangeStart = getDateRangeStart();
    return items.filter((consultation) => {
      if (statusFilter !== "all" && consultation.status !== statusFilter) return false;
      if (practiceAreaFilter !== "all" && consultation.practice_areas?.name !== practiceAreaFilter) {
        return false;
      }
      if (rangeStart) {
        const scheduledAt = new Date(consultation.scheduled_at);
        if (scheduledAt < rangeStart) return false;
      }
      return true;
    });
  };

  const pendingConsultations = useMemo(
    () => upcomingConsultations.filter((c) => c.status === "pending"),
    [upcomingConsultations]
  );

  const todayConsultations = useMemo(
    () => upcomingConsultations.filter((c) => isToday(new Date(c.scheduled_at))),
    [upcomingConsultations]
  );

  const filteredUpcoming = useMemo(
    () => filterConsultations(upcomingConsultations),
    [upcomingConsultations, statusFilter, practiceAreaFilter, dateRangeFilter]
  );

  const filteredPast = useMemo(
    () => filterConsultations(pastConsultations),
    [pastConsultations, statusFilter, practiceAreaFilter, dateRangeFilter]
  );

  const displayedUpcoming = showAllUpcoming ? filteredUpcoming : filteredUpcoming.slice(0, 5);
  const displayedPast = showAllPast ? filteredPast : filteredPast.slice(0, 5);

  const practiceAreaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...upcomingConsultations, ...pastConsultations]
            .map((consultation) => consultation.practice_areas?.name)
            .filter(Boolean)
        )
      ),
    [upcomingConsultations, pastConsultations]
  );

  const getLawyerTimezone = () => lawyerProfile?.timezone || "America/New_York";

  const formatConsultationDateTime = (value: string) => {
    const timezone = getLawyerTimezone();
    return formatInTimeZone(new Date(value), timezone, "PPP 'at' p zzz");
  };

  const formatConsultationTime = (value: string) => {
    const timezone = getLawyerTimezone();
    return formatInTimeZone(new Date(value), timezone, "h:mm a zzz");
  };

  const isWithinJoinWindow = (scheduledAt: string) => {
    const now = new Date();
    const start = new Date(scheduledAt);
    const earliestJoin = new Date(start.getTime() - 15 * 60 * 1000);
    const latestJoin = new Date(start.getTime() + 30 * 60 * 1000);
    return now >= earliestJoin && now <= latestJoin;
  };

  const getMeetingLink = (consultation: any) =>
    consultation?.lawyer_join_link || consultation?.meeting_link || "";

  const updateConsultationStatus = async (consultationId: string, status: string) => {
    const { error } = await supabase
      .from("consultations")
      .update({ status })
      .eq("id", consultationId);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else if (userId) {
      toast({ title: "Status updated" });
      await fetchConsultations(userId);
      if (lawyerProfile?.id) {
        await refreshOverviewStats(lawyerProfile.id);
      }
    }
  };

  const handleReschedule = (consultation: any) => {
    setConsultationToReschedule(consultation);
    setRescheduleDate(undefined);
    setRescheduleSlotId("");
    setRescheduleSlots([]);
    setRescheduleReason("");
    setRescheduleDialogOpen(true);
  };

  const fetchRescheduleSlots = async (date: Date) => {
    if (!lawyerProfile?.id) return;
    const timezone = getLawyerTimezone();
    const dateStr = formatInTimeZone(date, timezone, "yyyy-MM-dd");
    const startZoned = fromZonedTime(`${dateStr}T00:00:00.000`, timezone);
    const endZoned = fromZonedTime(`${dateStr}T23:59:59.999`, timezone);
    const { data, error } = await supabase
      .from("time_slots")
      .select("*")
      .eq("lawyer_id", lawyerProfile.id)
      .eq("is_booked", false)
      .gte("start_time", startZoned.toISOString())
      .lte("start_time", endZoned.toISOString())
      .order("start_time");

    if (error) {
      toast({
        title: "Failed to load slots",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setRescheduleSlots(data || []);
  };

  const handleConfirmReschedule = async () => {
    if (!consultationToReschedule || !rescheduleSlotId || !userId) return;
    setRescheduling(true);
    try {
      const newSlot = rescheduleSlots.find((slot) => slot.id === rescheduleSlotId);
      const { data, error } = await (supabase as any).rpc("reschedule_consultation", {
        p_consultation_id: consultationToReschedule.id,
        p_user_id: userId,
        p_new_slot_id: rescheduleSlotId,
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string };
      if (!result?.success) {
        throw new Error(result?.error || "Failed to reschedule");
      }

      await supabase.functions.invoke("send-consultation-notification", {
        body: {
          type: "reschedule",
          lawyerEmail: profile?.email || "",
          lawyerName: profile?.full_name || "Lawyer",
          clientEmail: consultationToReschedule.profiles?.email || "",
          clientName: consultationToReschedule.profiles?.full_name || "Client",
          consultationDate: formatConsultationDateTime(consultationToReschedule.scheduled_at),
          practiceArea: consultationToReschedule.practice_areas?.name,
          newConsultationDate: newSlot?.start_time
            ? formatConsultationDateTime(newSlot.start_time)
            : null,
          reason: rescheduleReason || null,
        },
      });

      toast({
        title: "Consultation rescheduled",
        description: "The client has been notified.",
      });

      await fetchConsultations(userId);
      if (lawyerProfile?.id) {
        await refreshOverviewStats(lawyerProfile.id);
      }
      setRescheduleDialogOpen(false);
      setConsultationToReschedule(null);
    } catch (error: any) {
      toast({
        title: "Reschedule failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancelClick = (consultation: any) => {
    setConsultationToCancel(consultation);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!userId || !consultationToCancel) return;
    const result = await cancelConsultationHandler(consultationToCancel, userId, profile, "lawyer");
    if (result.success) {
      await fetchConsultations(userId);
      if (lawyerProfile?.id) {
        await refreshOverviewStats(lawyerProfile.id);
      }
      setCancelDialogOpen(false);
      setConsultationToCancel(null);
    }
  };


  const resetScheduleFilters = () => {
    setStatusFilter("all");
    setDateRangeFilter("all");
    setPracticeAreaFilter("all");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getLawyerStorageKey(userId, "statusFilter"), "all");
      window.localStorage.setItem(getLawyerStorageKey(userId, "dateRangeFilter"), "all");
      window.localStorage.setItem(getLawyerStorageKey(userId, "practiceAreaFilter"), "all");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedStatus = window.localStorage.getItem(getLawyerStorageKey(userId, "statusFilter"));
    if (storedStatus && VALID_STATUS_FILTERS.includes(storedStatus as any)) {
      setStatusFilter(storedStatus);
    }
    const storedDate = window.localStorage.getItem(getLawyerStorageKey(userId, "dateRangeFilter"));
    if (storedDate && VALID_DATE_RANGE_FILTERS.includes(storedDate as any)) {
      setDateRangeFilter(storedDate);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getLawyerStorageKey(userId, "statusFilter"), statusFilter);
  }, [statusFilter, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getLawyerStorageKey(userId, "dateRangeFilter"), dateRangeFilter);
  }, [dateRangeFilter, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(getLawyerStorageKey(userId, "practiceAreaFilter"));
    if (!stored) return;
    if (stored === "all" || practiceAreaOptions.includes(stored)) {
      setPracticeAreaFilter(stored);
    }
  }, [userId, practiceAreaOptions.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getLawyerStorageKey(userId, "practiceAreaFilter"), practiceAreaFilter);
  }, [practiceAreaFilter, userId]);

  useEffect(() => {
    if (rescheduleDate) {
      fetchRescheduleSlots(rescheduleDate);
    } else {
      setRescheduleSlots([]);
      setRescheduleSlotId("");
    }
  }, [rescheduleDate]);

  useEffect(() => {
    if (!userId || !lawyerProfile?.id) return;
    const channel = supabase
      .channel(`lawyer-consultations-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultations",
          filter: `lawyer_id=eq.${lawyerProfile.id}`,
        },
        async () => {
          await fetchConsultations(userId);
          await refreshOverviewStats(lawyerProfile.id);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, lawyerProfile?.id]);

  return {
    consultationsLoading,
    upcomingConsultations,
    pastConsultations,
    pendingConsultations,
    todayConsultations,
    filteredUpcoming,
    filteredPast,
    displayedUpcoming,
    displayedPast,
    practiceAreaOptions,
    statusFilter,
    setStatusFilter,
    dateRangeFilter,
    setDateRangeFilter,
    practiceAreaFilter,
    setPracticeAreaFilter,
    showAllUpcoming,
    setShowAllUpcoming,
    showAllPast,
    setShowAllPast,
    resetScheduleFilters,
    fetchConsultations,
    updateConsultationStatus,
    handleReschedule,
    rescheduleDialogOpen,
    setRescheduleDialogOpen,
    consultationToReschedule,
    rescheduleDate,
    setRescheduleDate,
    rescheduleSlots,
    rescheduleSlotId,
    setRescheduleSlotId,
    rescheduleReason,
    setRescheduleReason,
    rescheduling,
    handleConfirmReschedule,
    handleCancelClick,
    cancelDialogOpen,
    setCancelDialogOpen,
    consultationToCancel,
    handleCancelConfirm,
    getLawyerTimezone,
    formatConsultationDateTime,
    formatConsultationTime,
    isWithinJoinWindow,
    getMeetingLink,
  };
};

export default useLawyerConsultations;
