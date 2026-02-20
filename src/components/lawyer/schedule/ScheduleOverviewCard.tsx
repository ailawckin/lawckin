import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";
import { DAY_FILTER_OPTIONS, SOURCE_FILTER_OPTIONS, UPCOMING_RANGE_OPTIONS } from "@/lib/schedule/constants";
import type { AvailabilityBlock, DayFilter, ScheduleListFilter, SourceFilter } from "@/lib/schedule/types";

interface ScheduleOverviewCardProps {
  showScheduleOverview: boolean;
  onToggleVisibility: () => void;
  defaultUpcomingRangeDays: number;
  defaultSourceFilter: SourceFilter;
  defaultDayFilter: DayFilter;
  defaultScheduleListFilter: ScheduleListFilter;
  onResetFilters: () => void;
  upcomingRangeDays: number;
  onChangeUpcomingRangeDays: (value: number) => void;
  sourceFilter: SourceFilter;
  onChangeSourceFilter: (value: SourceFilter) => void;
  dayFilter: DayFilter;
  onChangeDayFilter: (value: DayFilter) => void;
  showFullSchedule: boolean;
  onToggleShowFullSchedule: (value: boolean) => void;
  scheduleListFilter: ScheduleListFilter;
  onChangeScheduleListFilter: (value: ScheduleListFilter) => void;
  scheduleWeekDate: Date;
  onChangeScheduleWeekDate: (date: Date) => void;
  scheduleWeekStart: Date;
  scheduleWeekLabel: string;
  upcomingEntries: Array<[string, AvailabilityBlock[]]>;
  upcomingBlockCount: number;
  fullListEntries: Array<[string, AvailabilityBlock[]]>;
  timezone: string;
  onDeleteAvailabilityBlock: (id: string) => void;
  formatTime: (time: string) => string;
  getSourceLabel: (source?: AvailabilityBlock["source"]) => string;
  getSourceBadgeClass: (source?: AvailabilityBlock["source"]) => string;
}

export function ScheduleOverviewCard({
  showScheduleOverview,
  onToggleVisibility,
  defaultUpcomingRangeDays,
  defaultSourceFilter,
  defaultDayFilter,
  defaultScheduleListFilter,
  onResetFilters,
  upcomingRangeDays,
  onChangeUpcomingRangeDays,
  sourceFilter,
  onChangeSourceFilter,
  dayFilter,
  onChangeDayFilter,
  showFullSchedule,
  onToggleShowFullSchedule,
  scheduleListFilter,
  onChangeScheduleListFilter,
  scheduleWeekDate,
  onChangeScheduleWeekDate,
  scheduleWeekStart,
  scheduleWeekLabel,
  upcomingEntries,
  upcomingBlockCount,
  fullListEntries,
  timezone,
  onDeleteAvailabilityBlock,
  formatTime,
  getSourceLabel,
  getSourceBadgeClass,
}: ScheduleOverviewCardProps) {
  const hasActiveFilters =
    upcomingRangeDays !== defaultUpcomingRangeDays ||
    sourceFilter !== defaultSourceFilter ||
    dayFilter !== defaultDayFilter ||
    scheduleListFilter !== defaultScheduleListFilter ||
    showFullSchedule;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Your Schedule</CardTitle>
            <CardDescription>
              Weekly template, week overrides, and one-off availability combined.
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onToggleVisibility}>
            {showScheduleOverview ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      {showScheduleOverview && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Label className="text-xs text-muted-foreground">Upcoming range</Label>
                <Select
                  value={String(upcomingRangeDays)}
                  onValueChange={(value) => onChangeUpcomingRangeDays(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UPCOMING_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select
                  value={sourceFilter}
                  onValueChange={(value) => onChangeSourceFilter(value as SourceFilter)}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Label className="text-xs text-muted-foreground">Days</Label>
                <Select
                  value={dayFilter}
                  onValueChange={(value) => onChangeDayFilter(value as DayFilter)}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Label className="text-xs text-muted-foreground">Full schedule</Label>
                <Switch checked={showFullSchedule} onCheckedChange={onToggleShowFullSchedule} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Label className="text-xs text-muted-foreground">Full list</Label>
                <Select
                  value={scheduleListFilter}
                  onValueChange={(value) => onChangeScheduleListFilter(value as ScheduleListFilter)}
                  disabled={!showFullSchedule}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    <SelectItem value="week">Specific week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showFullSchedule && scheduleListFilter === "week" && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChangeScheduleWeekDate(addDays(scheduleWeekStart, -7))}
                  >
                    Prev
                  </Button>
                  <span className="font-medium">Week of {scheduleWeekLabel}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChangeScheduleWeekDate(addDays(scheduleWeekStart, 7))}
                  >
                    Next
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        Pick week
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Calendar
                        mode="single"
                        selected={scheduleWeekDate}
                        onSelect={(date) => date && onChangeScheduleWeekDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-muted-foreground">
              {upcomingEntries.length} day{upcomingEntries.length === 1 ? "" : "s"} • {" "}
              {upcomingBlockCount} block{upcomingBlockCount === 1 ? "" : "s"}
            </div>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={onResetFilters}>
                Reset filters
              </Button>
            )}
          </div>
        </div>

          {upcomingEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm font-medium">
                No availability in the next {upcomingRangeDays} days
              </p>
              <p className="text-xs text-muted-foreground">
                Update your weekly template or add a one-off time to start booking.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEntries.map(([date, blocks]) => (
                <div key={date} className="rounded-lg border px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">
                      {formatInTimeZone(new Date(`${date}T00:00:00`), timezone, "EEEE, MMM d")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {blocks.length} block{blocks.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {blocks.map((block) => {
                      const key =
                        block.id ??
                        `${block.availability_date}-${block.start_time}-${block.end_time}-${block.source}`;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {formatTime(block.start_time)} - {formatTime(block.end_time)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getSourceBadgeClass(
                              block.source
                            )}`}
                          >
                            {getSourceLabel(block.source)}
                          </span>
                          {block.source !== "weekly" && block.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteAvailabilityBlock(block.id!)}
                              className="h-5 w-5 p-0 text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showFullSchedule && (
            <div className="space-y-3 pt-2">
              {fullListEntries.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                  <p className="mb-2 text-lg font-medium">No availability set yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first available time slot above to start accepting bookings
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fullListEntries.map(([date, blocks]) => (
                    <div key={date} className="rounded-lg border px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          {formatInTimeZone(
                            new Date(`${date}T00:00:00`),
                            timezone,
                            "EEEE, MMM d"
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {blocks.length} block{blocks.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {blocks.map((block) => {
                          const key =
                            block.id ??
                            `${block.availability_date}-${block.start_time}-${block.end_time}-${block.source}`;
                          return (
                            <div
                              key={key}
                              className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
                            >
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">
                                {formatTime(block.start_time)} - {formatTime(block.end_time)}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getSourceBadgeClass(
                                  block.source
                                )}`}
                              >
                                {getSourceLabel(block.source)}
                              </span>
                              {block.source !== "weekly" && block.id && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDeleteAvailabilityBlock(block.id!)}
                                  className="h-5 w-5 p-0 text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
