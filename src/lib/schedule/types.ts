export type AvailabilitySource = "manual" | "weekly" | "override";

export interface AvailabilityBlock {
  id?: string;
  availability_date: string;
  start_time: string;
  end_time: string;
  source?: AvailabilitySource;
}

export interface WeeklyAvailabilityBlock {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface AvailabilityException {
  id: string;
  exception_date: string;
  reason?: string | null;
}

export type AvailabilityMode = "template" | "week";
export type SourceFilter = "all" | AvailabilitySource;
export type DayFilter = "all" | "weekdays" | "weekends";
export type ScheduleListFilter = "all" | "week";
export type ExceptionSelectMode = "range" | "multiple";
