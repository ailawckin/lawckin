import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  applyEntryFilters,
  buildGroupedAvailability,
  parseTimeToMinutes,
} from "@/lib/schedule/utils";
import type {
  AvailabilityBlock,
  DayFilter,
  ScheduleListFilter,
  SourceFilter,
} from "@/lib/schedule/types";

interface UseScheduleAvailabilityParams {
  lawyerId: string;
  timezone: string;
  slotMinutes: number;
  upcomingRangeDays: number;
  sourceFilter: SourceFilter;
  dayFilter: DayFilter;
  scheduleListFilter: ScheduleListFilter;
  scheduleWeekStart: Date;
  showFullSchedule: boolean;
}

export function useScheduleAvailability({
  lawyerId,
  timezone,
  slotMinutes,
  upcomingRangeDays,
  sourceFilter,
  dayFilter,
  scheduleListFilter,
  scheduleWeekStart,
  showFullSchedule,
}: UseScheduleAvailabilityParams) {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [fullListAvailability, setFullListAvailability] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from("lawyer_date_availability")
        .select("*")
        .eq("lawyer_id", lawyerId)
        .gte("availability_date", new Date().toISOString().split("T")[0])
        .order("availability_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading schedule",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFullListAvailability = async () => {
    if (!lawyerId) return;
    const startKey = formatInTimeZone(scheduleWeekStart, timezone, "yyyy-MM-dd");
    const endKey = formatInTimeZone(addDays(scheduleWeekStart, 6), timezone, "yyyy-MM-dd");
    try {
      let query = supabase
        .from("lawyer_date_availability")
        .select("*")
        .eq("lawyer_id", lawyerId)
        .order("availability_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (scheduleListFilter === "week") {
        query = query.gte("availability_date", startKey).lte("availability_date", endKey);
      } else {
        const todayKey = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
        query = query.gte("availability_date", todayKey);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFullListAvailability(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading schedule list",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [lawyerId]);

  useEffect(() => {
    if (!showFullSchedule) return;
    if (scheduleListFilter === "all") {
      setFullListAvailability(availability);
      return;
    }
    fetchFullListAvailability();
  }, [
    showFullSchedule,
    scheduleListFilter,
    scheduleWeekStart,
    availability,
    timezone,
    lawyerId,
  ]);

  const validateBlock = (block: Partial<AvailabilityBlock>, date?: string): string | null => {
    if (!date) return "Please select a date";
    if (!block.start_time || !block.end_time) return "Please select start and end times";
    if (block.start_time >= block.end_time) return "End time must be after start time";
    const durationMinutes =
      parseTimeToMinutes(block.end_time) - parseTimeToMinutes(block.start_time);
    if (durationMinutes < slotMinutes) {
      return `Availability must be at least ${slotMinutes} minutes.`;
    }

    const hasOverlap = availability.some(
      (existing) =>
        existing.availability_date === date &&
        existing.start_time < block.end_time! &&
        existing.end_time > block.start_time!
    );

    if (hasOverlap) return "This time overlaps with existing availability";

    return null;
  };

  const addAvailabilityBlock = async (
    selectedDate: Date | undefined,
    block: Partial<AvailabilityBlock>
  ) => {
    if (!selectedDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return false;
    }

    const dateString = formatInTimeZone(selectedDate, timezone, "yyyy-MM-dd");
    const validationError = validateBlock(block, dateString);

    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("lawyer_date_availability").insert({
        lawyer_id: lawyerId,
        availability_date: dateString,
        start_time: block.start_time!,
        end_time: block.end_time!,
        source: "manual",
      });

      if (error) throw error;

      toast({ title: "✓ Availability added", description: "Clients can now book this time" });
      await fetchAvailability();
      if (showFullSchedule && scheduleListFilter === "week") {
        await fetchFullListAvailability();
      }
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteAvailabilityBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lawyer_date_availability")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "✓ Availability removed" });
      await fetchAvailability();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const groupedUpcomingAvailability = useMemo(
    () => buildGroupedAvailability(availability, timezone),
    [availability, timezone]
  );

  const groupedFullAvailability = useMemo(
    () => buildGroupedAvailability(fullListAvailability, timezone),
    [fullListAvailability, timezone]
  );

  const upcomingEntries = useMemo(() => {
    const startKey = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
    const endKey = formatInTimeZone(
      addDays(new Date(), upcomingRangeDays - 1),
      timezone,
      "yyyy-MM-dd"
    );

    const entries = Object.entries(groupedUpcomingAvailability)
      .filter(([date]) => date >= startKey && date <= endKey)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
    return applyEntryFilters(entries, timezone, dayFilter, sourceFilter);
  }, [groupedUpcomingAvailability, timezone, upcomingRangeDays, sourceFilter, dayFilter]);

  const upcomingBlockCount = useMemo(
    () => upcomingEntries.reduce((total, [, blocks]) => total + blocks.length, 0),
    [upcomingEntries]
  );

  const fullListEntries = useMemo(() => {
    const entries = Object.entries(groupedFullAvailability).sort(([dateA], [dateB]) =>
      dateA.localeCompare(dateB)
    );

    const scopedEntries =
      scheduleListFilter === "all"
        ? entries
        : entries.filter(([date]) => {
            const startKey = formatInTimeZone(scheduleWeekStart, timezone, "yyyy-MM-dd");
            const endKey = formatInTimeZone(addDays(scheduleWeekStart, 6), timezone, "yyyy-MM-dd");
            return date >= startKey && date <= endKey;
          });

    return applyEntryFilters(scopedEntries, timezone, dayFilter, sourceFilter);
  }, [
    groupedFullAvailability,
    scheduleListFilter,
    scheduleWeekStart,
    timezone,
    sourceFilter,
    dayFilter,
  ]);

  return {
    availability,
    loading,
    saving,
    fetchAvailability,
    fetchFullListAvailability,
    addAvailabilityBlock,
    deleteAvailabilityBlock,
    upcomingEntries,
    upcomingBlockCount,
    fullListEntries,
  };
}
