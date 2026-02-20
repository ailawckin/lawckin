import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildExceptionGroups } from "@/lib/schedule/utils";
import type { AvailabilityException, ExceptionSelectMode } from "@/lib/schedule/types";

interface UseScheduleExceptionsParams {
  lawyerId: string;
  timezone: string;
}

export function useScheduleExceptions({ lawyerId, timezone }: UseScheduleExceptionsParams) {
  const { toast } = useToast();
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(true);
  const [exceptionDates, setExceptionDates] = useState<Date[]>([]);
  const [exceptionRange, setExceptionRange] = useState<{ from?: Date; to?: Date }>({});
  const [exceptionSelectMode, setExceptionSelectMode] = useState<ExceptionSelectMode>("range");
  const [exceptionReason, setExceptionReason] = useState("");

  const fetchExceptions = async () => {
    setExceptionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lawyer_availability_exceptions")
        .select("id, exception_date, reason")
        .eq("lawyer_id", lawyerId)
        .order("exception_date", { ascending: true });

      if (error) throw error;
      setExceptions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading days off",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExceptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [lawyerId]);

  const selectedExceptionDates = useMemo(() => {
    if (exceptionSelectMode === "multiple") {
      return exceptionDates;
    }

    if (!exceptionRange.from) return [];
    const rangeStart = exceptionRange.from;
    const rangeEnd = exceptionRange.to ?? exceptionRange.from;
    const start = rangeEnd < rangeStart ? rangeEnd : rangeStart;
    const end = rangeEnd < rangeStart ? rangeStart : rangeEnd;
    const days: Date[] = [];
    let cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [exceptionSelectMode, exceptionDates, exceptionRange]);

  const clearExceptionSelection = () => {
    setExceptionDates([]);
    setExceptionRange({});
    setExceptionReason("");
  };

  const addException = async () => {
    if (selectedExceptionDates.length === 0) {
      toast({ title: "Please select one or more dates", variant: "destructive" });
      return false;
    }

    const dateKeys = Array.from(
      new Set(selectedExceptionDates.map((date) => formatInTimeZone(date, timezone, "yyyy-MM-dd")))
    );
    const existing = new Set(exceptions.map((item) => item.exception_date));
    const reasonValue = exceptionReason.trim() || null;
    const toInsert = dateKeys
      .filter((date) => !existing.has(date))
      .map((date) => ({
        lawyer_id: lawyerId,
        exception_date: date,
        reason: reasonValue,
      }));

    if (toInsert.length === 0) {
      toast({ title: "Those days are already marked off." });
      return false;
    }

    try {
      const { error } = await supabase.from("lawyer_availability_exceptions").insert(toInsert);

      if (error) throw error;

      await fetchExceptions();
      toast({
        title: "Days off added",
        description: `${toInsert.length} day${toInsert.length === 1 ? "" : "s"} blocked.`,
      });
      clearExceptionSelection();
      return true;
    } catch (error: any) {
      toast({
        title: "Error adding day off",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const removeException = async (exceptionId: string) => {
    try {
      const { error } = await supabase
        .from("lawyer_availability_exceptions")
        .delete()
        .eq("id", exceptionId);

      if (error) throw error;
      await fetchExceptions();
      toast({ title: "Day off removed" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error removing day off",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const removeExceptionGroup = async (exceptionIds: string[]) => {
    if (exceptionIds.length === 0) return false;
    try {
      const { error } = await supabase
        .from("lawyer_availability_exceptions")
        .delete()
        .in("id", exceptionIds);

      if (error) throw error;
      await fetchExceptions();
      toast({ title: "Days off removed" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error removing day off",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const exceptionGroups = useMemo(() => buildExceptionGroups(exceptions), [exceptions]);

  return {
    exceptions,
    exceptionsLoading,
    exceptionDates,
    setExceptionDates,
    exceptionRange,
    setExceptionRange,
    exceptionSelectMode,
    setExceptionSelectMode,
    exceptionReason,
    setExceptionReason,
    selectedExceptionDates,
    exceptionGroups,
    addException,
    removeException,
    removeExceptionGroup,
    clearExceptionSelection,
    refreshExceptions: fetchExceptions,
  };
}
