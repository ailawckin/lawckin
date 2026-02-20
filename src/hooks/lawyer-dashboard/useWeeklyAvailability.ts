import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createEmptyGrid, minutesToTime, parseTimeToMinutes } from "@/lib/schedule/utils";
import { WEEK_DAYS, APPLY_RANGE_OPTIONS } from "@/lib/schedule/constants";
import type { AvailabilityBlock, AvailabilityMode, WeeklyAvailabilityBlock } from "@/lib/schedule/types";

interface UseWeeklyAvailabilityParams {
  lawyerId: string;
  timezone: string;
  slotMinutes: number;
  gridStartMinutes: number;
  slotCount: number;
  refreshAvailability: () => Promise<void>;
  refreshExceptions: () => Promise<void>;
}

export function useWeeklyAvailability({
  lawyerId,
  timezone,
  slotMinutes,
  gridStartMinutes,
  slotCount,
  refreshAvailability,
  refreshExceptions,
}: UseWeeklyAvailabilityParams) {
  const { toast } = useToast();
  const [weeklyBlocks, setWeeklyBlocks] = useState<WeeklyAvailabilityBlock[]>([]);
  const [weeklyGrid, setWeeklyGrid] = useState<Record<number, boolean[]>>({});
  const [weekGrid, setWeekGrid] = useState<Record<number, boolean[]>>({});
  const [weekAvailability, setWeekAvailability] = useState<AvailabilityBlock[]>([]);
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>("template");
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date());
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklySaving, setWeeklySaving] = useState(false);
  const [applyRangeDays, setApplyRangeDays] = useState(APPLY_RANGE_OPTIONS[1].value);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);

  const weekStart = useMemo(
    () => startOfWeek(selectedWeekDate, { weekStartsOn: 1 }),
    [selectedWeekDate]
  );

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx)),
    [weekStart]
  );

  const weekLabel = useMemo(
    () => `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d")}`,
    [weekStart]
  );

  const fetchWeeklyAvailability = async () => {
    setWeeklyLoading(true);
    try {
      const { data, error } = await supabase
        .from("lawyer_weekly_availability")
        .select("day_of_week,start_time,end_time")
        .eq("lawyer_id", lawyerId);

      if (error) throw error;

      setWeeklyBlocks(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading weekly availability",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWeeklyLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyAvailability();
  }, [lawyerId]);

  useEffect(() => {
    if (weeklyLoading) return;
    const nextGrid = createEmptyGrid(slotCount);
    weeklyBlocks.forEach((block) => {
      const daySlots = nextGrid[block.day_of_week] || Array(slotCount).fill(false);
      const start = parseTimeToMinutes(block.start_time);
      const end = parseTimeToMinutes(block.end_time);
      const startIndex = Math.max(0, Math.floor((start - gridStartMinutes) / slotMinutes));
      const endIndex = Math.min(slotCount, Math.ceil((end - gridStartMinutes) / slotMinutes));
      for (let idx = startIndex; idx < endIndex; idx += 1) {
        daySlots[idx] = true;
      }
      nextGrid[block.day_of_week] = daySlots;
    });
    setWeeklyGrid(nextGrid);
  }, [weeklyLoading, weeklyBlocks, slotCount, gridStartMinutes, slotMinutes]);

  useEffect(() => {
    if (availabilityMode !== "week") return;
    const nextGrid = createEmptyGrid(slotCount);
    weekDates.forEach((date, idx) => {
      const dateKey = formatInTimeZone(date, timezone, "yyyy-MM-dd");
      const blocks = weekAvailability.filter((block) => block.availability_date === dateKey);
      const dayValue = WEEK_DAYS[idx].value;
      const daySlots = nextGrid[dayValue] || Array(slotCount).fill(false);
      blocks.forEach((block) => {
        const start = parseTimeToMinutes(block.start_time);
        const end = parseTimeToMinutes(block.end_time);
        const startIndex = Math.max(0, Math.floor((start - gridStartMinutes) / slotMinutes));
        const endIndex = Math.min(slotCount, Math.ceil((end - gridStartMinutes) / slotMinutes));
        for (let slotIdx = startIndex; slotIdx < endIndex; slotIdx += 1) {
          daySlots[slotIdx] = true;
        }
      });
      nextGrid[dayValue] = daySlots;
    });
    setWeekGrid(nextGrid);
  }, [
    availabilityMode,
    weekDates,
    weekAvailability,
    slotCount,
    gridStartMinutes,
    slotMinutes,
    timezone,
  ]);

  const fetchWeekAvailability = async () => {
    const startStr = formatInTimeZone(weekStart, timezone, "yyyy-MM-dd");
    const endStr = formatInTimeZone(addDays(weekStart, 6), timezone, "yyyy-MM-dd");
    try {
      const { data, error } = await supabase
        .from("lawyer_date_availability")
        .select("*")
        .eq("lawyer_id", lawyerId)
        .gte("availability_date", startStr)
        .lte("availability_date", endStr)
        .order("availability_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setWeekAvailability(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading week availability",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!lawyerId) return;
    if (availabilityMode !== "week") return;
    fetchWeekAvailability();
  }, [availabilityMode, weekStart, lawyerId, timezone]);

  const getApplyRange = () => {
    const start = new Date();
    const end = addDays(start, applyRangeDays);
    const startStr = formatInTimeZone(start, timezone, "yyyy-MM-dd");
    const endStr = formatInTimeZone(end, timezone, "yyyy-MM-dd");
    return { startStr, endStr };
  };

  const applyWeeklyAvailability = async ({ showToast = true } = {}) => {
    if (!lawyerId) return;
    const { startStr, endStr } = getApplyRange();
    try {
      const { error } = await supabase.rpc("apply_weekly_availability", {
        p_lawyer_id: lawyerId,
        p_start_date: startStr,
        p_end_date: endStr,
      });

      if (error) throw error;

      await refreshAvailability();
      if (showToast) {
        toast({
          title: "Weekly availability applied",
          description: `Generated availability from ${startStr} to ${endStr}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to apply weekly availability",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const buildBlocksFromGrid = (grid: Record<number, boolean[]>) => {
    const blocks: WeeklyAvailabilityBlock[] = [];
    WEEK_DAYS.forEach((day) => {
      const slots = grid[day.value] || [];
      let startIndex: number | null = null;
      for (let idx = 0; idx <= slotCount; idx += 1) {
        const isSelected = idx < slotCount ? slots[idx] : false;
        if (isSelected && startIndex === null) {
          startIndex = idx;
        }
        if (!isSelected && startIndex !== null) {
          const startMinutes = gridStartMinutes + startIndex * slotMinutes;
          const endMinutes = gridStartMinutes + idx * slotMinutes;
          if (endMinutes > startMinutes) {
            blocks.push({
              day_of_week: day.value,
              start_time: minutesToTime(startMinutes),
              end_time: minutesToTime(endMinutes),
            });
          }
          startIndex = null;
        }
      }
    });
    return blocks;
  };

  const saveWeeklyAvailability = async () => {
    setWeeklySaving(true);
    try {
      const blocks = buildBlocksFromGrid(weeklyGrid);
      const payload = blocks.map((block) => ({
        lawyer_id: lawyerId,
        day_of_week: block.day_of_week,
        start_time: block.start_time,
        end_time: block.end_time,
      }));

      const { error: deleteError } = await supabase
        .from("lawyer_weekly_availability")
        .delete()
        .eq("lawyer_id", lawyerId);
      if (deleteError) throw deleteError;

      if (payload.length > 0) {
        const { error: insertError } = await supabase
          .from("lawyer_weekly_availability")
          .insert(payload);
        if (insertError) throw insertError;
      }

      await fetchWeeklyAvailability();
      const { startStr, endStr } = getApplyRange();
      await applyWeeklyAvailability({ showToast: false });
      toast({
        title: "Weekly template saved",
        description: `Applied from ${startStr} to ${endStr}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving weekly availability",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWeeklySaving(false);
    }
  };

  const buildWeekAvailabilityPayload = () => {
    const payload: Array<{
      lawyer_id: string;
      availability_date: string;
      start_time: string;
      end_time: string;
      source: "override";
    }> = [];
    const daysWithSlots = new Set<string>();

    weekDates.forEach((date, idx) => {
      const dayValue = WEEK_DAYS[idx].value;
      const slots = weekGrid[dayValue] || [];
      let startIndex: number | null = null;
      for (let slotIdx = 0; slotIdx <= slotCount; slotIdx += 1) {
        const isSelected = slotIdx < slotCount ? slots[slotIdx] : false;
        if (isSelected && startIndex === null) {
          startIndex = slotIdx;
          daysWithSlots.add(formatInTimeZone(date, timezone, "yyyy-MM-dd"));
        }
        if (!isSelected && startIndex !== null) {
          const startMinutes = gridStartMinutes + startIndex * slotMinutes;
          const endMinutes = gridStartMinutes + slotIdx * slotMinutes;
          if (endMinutes > startMinutes) {
            payload.push({
              lawyer_id: lawyerId,
              availability_date: formatInTimeZone(date, timezone, "yyyy-MM-dd"),
              start_time: minutesToTime(startMinutes),
              end_time: minutesToTime(endMinutes),
              source: "override",
            });
          }
          startIndex = null;
        }
      }
    });

    return { payload, daysWithSlots };
  };

  const saveWeekOverride = async () => {
    if (!lawyerId) return;
    setWeeklySaving(true);
    const weekDatesStrings = weekDates.map((date) => formatInTimeZone(date, timezone, "yyyy-MM-dd"));
    try {
      const { payload, daysWithSlots } = buildWeekAvailabilityPayload();

      const { error: clearExceptionsError } = await supabase
        .from("lawyer_availability_exceptions")
        .delete()
        .eq("lawyer_id", lawyerId)
        .in("exception_date", weekDatesStrings);

      if (clearExceptionsError) throw clearExceptionsError;

      const exceptionRows = weekDatesStrings
        .filter((date) => !daysWithSlots.has(date))
        .map((date) => ({ lawyer_id: lawyerId, exception_date: date }));

      if (exceptionRows.length > 0) {
        const { error: exceptionError } = await supabase
          .from("lawyer_availability_exceptions")
          .insert(exceptionRows);
        if (exceptionError) throw exceptionError;
      }

      const { error: deleteError } = await supabase
        .from("lawyer_date_availability")
        .delete()
        .eq("lawyer_id", lawyerId)
        .in("availability_date", weekDatesStrings);

      if (deleteError) throw deleteError;

      if (payload.length > 0) {
        const { error: insertError } = await supabase
          .from("lawyer_date_availability")
          .insert(payload);
        if (insertError) throw insertError;
      }

      await refreshExceptions();
      await refreshAvailability();
      await fetchWeekAvailability();
      toast({
        title: "Week updated",
        description: "That week now overrides your template.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update week",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWeeklySaving(false);
    }
  };

  const resetWeekToTemplate = async () => {
    if (!lawyerId) return;
    setWeeklySaving(true);
    const weekDatesStrings = weekDates.map((date) => formatInTimeZone(date, timezone, "yyyy-MM-dd"));
    try {
      const { error: deleteExceptions } = await supabase
        .from("lawyer_availability_exceptions")
        .delete()
        .eq("lawyer_id", lawyerId)
        .in("exception_date", weekDatesStrings);
      if (deleteExceptions) throw deleteExceptions;

      const { error: deleteManual } = await supabase
        .from("lawyer_date_availability")
        .delete()
        .eq("lawyer_id", lawyerId)
        .eq("source", "override")
        .in("availability_date", weekDatesStrings);
      if (deleteManual) throw deleteManual;

      await supabase.rpc("apply_weekly_availability", {
        p_lawyer_id: lawyerId,
        p_start_date: weekDatesStrings[0],
        p_end_date: weekDatesStrings[6],
      });

      await refreshExceptions();
      await refreshAvailability();
      await fetchWeekAvailability();
      toast({
        title: "Week reset",
        description: "Template applied to this week again.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to reset week",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWeeklySaving(false);
    }
  };

  const updateGridCell = (dayValue: number, slotIndex: number, value: boolean) => {
    const update = (prev: Record<number, boolean[]>) => {
      const next = { ...prev };
      const daySlots = (next[dayValue] || Array(slotCount).fill(false)).slice();
      daySlots[slotIndex] = value;
      next[dayValue] = daySlots;
      return next;
    };

    if (availabilityMode === "template") {
      setWeeklyGrid(update);
    } else {
      setWeekGrid(update);
    }
  };

  const handleCellPointerDown = (dayValue: number, slotIndex: number) => {
    const activeGrid = availabilityMode === "template" ? weeklyGrid : weekGrid;
    const current = activeGrid[dayValue]?.[slotIndex] || false;
    const nextValue = !current;
    setDragValue(nextValue);
    setIsDragging(true);
    updateGridCell(dayValue, slotIndex, nextValue);
  };

  const handleCellPointerEnter = (dayValue: number, slotIndex: number) => {
    if (!isDragging || dragValue === null) return;
    updateGridCell(dayValue, slotIndex, dragValue);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragValue(null);
  };

  const clearActiveGrid = () => {
    if (availabilityMode === "template") {
      setWeeklyGrid(createEmptyGrid(slotCount));
    } else {
      setWeekGrid(createEmptyGrid(slotCount));
    }
  };

  const activeGrid = availabilityMode === "template" ? weeklyGrid : weekGrid;

  return {
    availabilityMode,
    setAvailabilityMode,
    selectedWeekDate,
    setSelectedWeekDate,
    applyRangeDays,
    setApplyRangeDays,
    weeklyLoading,
    weeklySaving,
    weekStart,
    weekDates,
    weekLabel,
    activeGrid,
    handleCellPointerDown,
    handleCellPointerEnter,
    handlePointerUp,
    clearActiveGrid,
    saveWeeklyAvailability,
    saveWeekOverride,
    resetWeekToTemplate,
    applyWeeklyAvailability,
  };
}
