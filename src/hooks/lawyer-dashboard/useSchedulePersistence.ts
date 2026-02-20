import { useEffect } from "react";
import {
  DAY_FILTER_OPTIONS,
  SOURCE_FILTER_OPTIONS,
  UPCOMING_RANGE_OPTIONS,
} from "@/lib/schedule/constants";
import type { DayFilter, ScheduleListFilter, SourceFilter } from "@/lib/schedule/types";

interface UseSchedulePersistenceParams {
  lawyerId?: string;
  upcomingRangeDays: number;
  setUpcomingRangeDays: (value: number) => void;
  sourceFilter: SourceFilter;
  setSourceFilter: (value: SourceFilter) => void;
  dayFilter: DayFilter;
  setDayFilter: (value: DayFilter) => void;
  showFullSchedule: boolean;
  setShowFullSchedule: (value: boolean) => void;
  scheduleListFilter: ScheduleListFilter;
  setScheduleListFilter: (value: ScheduleListFilter) => void;
  scheduleWeekDate: Date;
  setScheduleWeekDate: (value: Date) => void;
  showWeeklyAvailability: boolean;
  setShowWeeklyAvailability: (value: boolean) => void;
  showDaysOff: boolean;
  setShowDaysOff: (value: boolean) => void;
  showScheduleOverview: boolean;
  setShowScheduleOverview: (value: boolean) => void;
}

export function useSchedulePersistence({
  lawyerId,
  upcomingRangeDays,
  setUpcomingRangeDays,
  sourceFilter,
  setSourceFilter,
  dayFilter,
  setDayFilter,
  showFullSchedule,
  setShowFullSchedule,
  scheduleListFilter,
  setScheduleListFilter,
  scheduleWeekDate,
  setScheduleWeekDate,
  showWeeklyAvailability,
  setShowWeeklyAvailability,
  showDaysOff,
  setShowDaysOff,
  showScheduleOverview,
  setShowScheduleOverview,
}: UseSchedulePersistenceParams) {
  const scheduleStorageKey = (suffix: string) =>
    `lawyerSchedule.${lawyerId || "anonymous"}.${suffix}`;

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    const storedRange = window.localStorage.getItem(scheduleStorageKey("upcomingRangeDays"));
    const storedSource = window.localStorage.getItem(scheduleStorageKey("sourceFilter"));
    const storedDay = window.localStorage.getItem(scheduleStorageKey("dayFilter"));
    const storedFull = window.localStorage.getItem(scheduleStorageKey("showFullSchedule"));
    const storedList = window.localStorage.getItem(scheduleStorageKey("scheduleListFilter"));
    const storedWeek = window.localStorage.getItem(scheduleStorageKey("scheduleWeekDate"));
    const storedShowWeekly = window.localStorage.getItem(
      scheduleStorageKey("showWeeklyAvailability")
    );
    const storedShowDaysOff = window.localStorage.getItem(scheduleStorageKey("showDaysOff"));
    const storedShowOverview = window.localStorage.getItem(
      scheduleStorageKey("showScheduleOverview")
    );

    const rangeValue = storedRange ? Number(storedRange) : null;
    if (rangeValue && UPCOMING_RANGE_OPTIONS.some((option) => option.value === rangeValue)) {
      setUpcomingRangeDays(rangeValue);
    }
    if (storedSource && SOURCE_FILTER_OPTIONS.some((option) => option.value === storedSource)) {
      setSourceFilter(storedSource as SourceFilter);
    }
    if (storedDay && DAY_FILTER_OPTIONS.some((option) => option.value === storedDay)) {
      setDayFilter(storedDay as DayFilter);
    }
    if (storedFull === "true" || storedFull === "false") {
      setShowFullSchedule(storedFull === "true");
    }
    if (storedList === "all" || storedList === "week") {
      setScheduleListFilter(storedList);
    }
    if (storedWeek) {
      const parsed = new Date(storedWeek);
      if (!Number.isNaN(parsed.getTime())) {
        setScheduleWeekDate(parsed);
      }
    }
    if (storedShowWeekly === "true" || storedShowWeekly === "false") {
      setShowWeeklyAvailability(storedShowWeekly === "true");
    }
    if (storedShowDaysOff === "true" || storedShowDaysOff === "false") {
      setShowDaysOff(storedShowDaysOff === "true");
    }
    if (storedShowOverview === "true" || storedShowOverview === "false") {
      setShowScheduleOverview(storedShowOverview === "true");
    }
  }, [
    lawyerId,
    setDayFilter,
    setScheduleListFilter,
    setScheduleWeekDate,
    setShowDaysOff,
    setShowFullSchedule,
    setShowScheduleOverview,
    setShowWeeklyAvailability,
    setSourceFilter,
    setUpcomingRangeDays,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(scheduleStorageKey("upcomingRangeDays"), String(upcomingRangeDays));
  }, [upcomingRangeDays, lawyerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(scheduleStorageKey("sourceFilter"), sourceFilter);
  }, [sourceFilter, lawyerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(scheduleStorageKey("dayFilter"), dayFilter);
  }, [dayFilter, lawyerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(scheduleStorageKey("showFullSchedule"), String(showFullSchedule));
  }, [showFullSchedule, lawyerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(scheduleStorageKey("scheduleListFilter"), scheduleListFilter);
  }, [scheduleListFilter, lawyerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(
      scheduleStorageKey("scheduleWeekDate"),
      scheduleWeekDate.toISOString()
    );
  }, [scheduleWeekDate, lawyerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(
      scheduleStorageKey("showWeeklyAvailability"),
      String(showWeeklyAvailability)
    );
  }, [showWeeklyAvailability, lawyerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(scheduleStorageKey("showDaysOff"), String(showDaysOff));
  }, [showDaysOff, lawyerId]);

  useEffect(() => {
    if (typeof window === "undefined" || !lawyerId) return;
    window.localStorage.setItem(
      scheduleStorageKey("showScheduleOverview"),
      String(showScheduleOverview)
    );
  }, [showScheduleOverview, lawyerId]);
}
