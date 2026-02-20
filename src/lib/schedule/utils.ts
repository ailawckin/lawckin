import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { WEEK_DAYS } from "./constants";
import type { AvailabilityBlock, AvailabilityException, DayFilter, SourceFilter } from "./types";

export const parseTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

export const minutesToTime = (minutes: number) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
};

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${displayHour}:${minutes} ${ampm}`;
};

export const getSourceLabel = (source?: AvailabilityBlock["source"]) => {
  if (source === "weekly") return "Weekly";
  if (source === "override") return "Override";
  return "One-off";
};

export const getSourceBadgeClass = (source?: AvailabilityBlock["source"]) => {
  if (source === "weekly") return "bg-muted text-muted-foreground";
  if (source === "override") return "bg-primary/10 text-primary";
  return "bg-amber-500/10 text-amber-700";
};

export const createEmptyGrid = (slotCount: number) => {
  const grid: Record<number, boolean[]> = {};
  WEEK_DAYS.forEach((day) => {
    grid[day.value] = Array(slotCount).fill(false);
  });
  return grid;
};

export const buildGroupedAvailability = (
  blocks: AvailabilityBlock[],
  timezone: string
): Record<string, AvailabilityBlock[]> => {
  const overrideWeekKeys = new Set<string>();
  blocks
    .filter((block) => block.source === "override")
    .forEach((block) => {
      const weekStartDate = startOfWeek(new Date(`${block.availability_date}T00:00:00`), {
        weekStartsOn: 1,
      });
      overrideWeekKeys.add(formatInTimeZone(weekStartDate, timezone, "yyyy-MM-dd"));
    });

  return blocks.reduce((acc, block) => {
    if (block.source === "weekly") {
      const weekStartDate = startOfWeek(new Date(`${block.availability_date}T00:00:00`), {
        weekStartsOn: 1,
      });
      const weekKey = formatInTimeZone(weekStartDate, timezone, "yyyy-MM-dd");
      if (overrideWeekKeys.has(weekKey)) {
        return acc;
      }
    }

    const date = block.availability_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(block);
    return acc;
  }, {} as Record<string, AvailabilityBlock[]>);
};

export const applyEntryFilters = (
  entries: Array<[string, AvailabilityBlock[]]>,
  timezone: string,
  dayFilter: DayFilter,
  sourceFilter: SourceFilter
) => {
  return entries
    .filter(([date]) => {
      if (dayFilter === "all") return true;
      const dayIndex = Number(
        formatInTimeZone(new Date(`${date}T00:00:00`), timezone, "i")
      );
      const isWeekend = dayIndex === 6 || dayIndex === 7;
      return dayFilter === "weekends" ? isWeekend : !isWeekend;
    })
    .map(([date, blocks]) => {
      const filteredBlocks =
        sourceFilter === "all"
          ? blocks
          : blocks.filter((block) => (block.source ?? "manual") === sourceFilter);
      return [date, filteredBlocks] as [string, AvailabilityBlock[]];
    })
    .filter(([, blocks]) => blocks.length > 0);
};

export const buildExceptionGroups = (exceptions: AvailabilityException[]) => {
  if (exceptions.length === 0) return [];
  const sorted = [...exceptions].sort((a, b) => a.exception_date.localeCompare(b.exception_date));
  const groups: Array<{ ids: string[]; start: string; end: string; reason?: string | null }> = [];

  sorted.forEach((exception) => {
    const lastGroup = groups[groups.length - 1];
    const reason = exception.reason ?? null;
    if (!lastGroup) {
      groups.push({
        ids: [exception.id],
        start: exception.exception_date,
        end: exception.exception_date,
        reason,
      });
      return;
    }

    const lastEnd = parseISO(lastGroup.end);
    const expectedNext = format(addDays(lastEnd, 1), "yyyy-MM-dd");
    const sameReason = (lastGroup.reason ?? null) === reason;
    if (expectedNext === exception.exception_date && sameReason) {
      lastGroup.end = exception.exception_date;
      lastGroup.ids.push(exception.id);
    } else {
      groups.push({
        ids: [exception.id],
        start: exception.exception_date,
        end: exception.exception_date,
        reason,
      });
    }
  });

  return groups;
};
