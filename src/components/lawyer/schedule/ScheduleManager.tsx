import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { DaysOffCard } from "./DaysOffCard";
import { ScheduleOverviewCard } from "./ScheduleOverviewCard";
import { WeeklyAvailabilityCard } from "./WeeklyAvailabilityCard";
import { GRID_END_HOUR, GRID_START_HOUR, UPCOMING_RANGE_OPTIONS } from "@/lib/schedule/constants";
import type {
  AvailabilityBlock,
  DayFilter,
  ScheduleListFilter,
  SourceFilter,
} from "@/lib/schedule/types";
import { formatTime, getSourceBadgeClass, getSourceLabel } from "@/lib/schedule/utils";
import { useScheduleAvailability } from "@/hooks/lawyer-dashboard/useScheduleAvailability";
import { useScheduleExceptions } from "@/hooks/lawyer-dashboard/useScheduleExceptions";
import { useSchedulePersistence } from "@/hooks/lawyer-dashboard/useSchedulePersistence";
import { useWeeklyAvailability } from "@/hooks/lawyer-dashboard/useWeeklyAvailability";

interface ScheduleManagerProps {
  lawyerId: string;
  timezone?: string;
  slotDurationMinutes?: number;
}

const DEFAULT_BLOCK: Partial<AvailabilityBlock> = {
  start_time: "09:00:00",
  end_time: "17:00:00",
};

export function ScheduleManager({
  lawyerId,
  timezone = "America/New_York",
  slotDurationMinutes = 30,
}: ScheduleManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [newBlock, setNewBlock] = useState<Partial<AvailabilityBlock>>(DEFAULT_BLOCK);
  const [oneOffOpen, setOneOffOpen] = useState(false);
  const defaultUpcomingRangeDays = UPCOMING_RANGE_OPTIONS[1].value;
  const [upcomingRangeDays, setUpcomingRangeDays] = useState(defaultUpcomingRangeDays);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [scheduleListFilter, setScheduleListFilter] = useState<ScheduleListFilter>("all");
  const [scheduleWeekDate, setScheduleWeekDate] = useState<Date>(new Date());
  const [showWeeklyAvailability, setShowWeeklyAvailability] = useState(true);
  const [showDaysOff, setShowDaysOff] = useState(true);
  const [showScheduleOverview, setShowScheduleOverview] = useState(true);

  const slotMinutes = Math.max(15, Number(slotDurationMinutes) || 30);
  const gridStartMinutes = GRID_START_HOUR * 60;
  const gridEndMinutes = GRID_END_HOUR * 60;
  const slotCount = Math.max(1, Math.floor((gridEndMinutes - gridStartMinutes) / slotMinutes));

  const timeSlots = useMemo(
    () => Array.from({ length: slotCount }, (_, idx) => gridStartMinutes + idx * slotMinutes),
    [slotCount, gridStartMinutes, slotMinutes]
  );

  const timeLabels = useMemo(
    () =>
      timeSlots.map((minutes) => {
        if (minutes % 60 !== 0) return "";
        const hour = Math.floor(minutes / 60);
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const ampm = hour < 12 ? "AM" : "PM";
        return `${displayHour} ${ampm}`;
      }),
    [timeSlots]
  );

  const timeOptions = useMemo(() => {
    const totalSlots = Math.floor((24 * 60) / slotMinutes);
    return Array.from({ length: totalSlots }, (_, i) => {
      const minutes = i * slotMinutes;
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const labelMinute = minute.toString().padStart(2, "0");
      return {
        value: `${hour.toString().padStart(2, "0")}:${labelMinute}:00`,
        label: `${displayHour}:${labelMinute} ${ampm}`,
      };
    });
  }, [slotMinutes]);

  const scheduleWeekStart = useMemo(
    () => startOfWeek(scheduleWeekDate, { weekStartsOn: 1 }),
    [scheduleWeekDate]
  );

  const scheduleWeekLabel = useMemo(
    () => `${format(scheduleWeekStart, "MMM d")} - ${format(addDays(scheduleWeekStart, 6), "MMM d")}`,
    [scheduleWeekStart]
  );

  useSchedulePersistence({
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
  });

  const {
    loading,
    saving,
    fetchAvailability,
    addAvailabilityBlock,
    deleteAvailabilityBlock,
    upcomingEntries,
    upcomingBlockCount,
    fullListEntries,
  } = useScheduleAvailability({
    lawyerId,
    timezone,
    slotMinutes,
    upcomingRangeDays,
    sourceFilter,
    dayFilter,
    scheduleListFilter,
    scheduleWeekStart,
    showFullSchedule,
  });

  const scheduleExceptions = useScheduleExceptions({ lawyerId, timezone });

  const {
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
  } = useWeeklyAvailability({
    lawyerId,
    timezone,
    slotMinutes,
    gridStartMinutes,
    slotCount,
    refreshAvailability: fetchAvailability,
    refreshExceptions: scheduleExceptions.refreshExceptions,
  });

  useEffect(() => {
    if (!showWeeklyAvailability && oneOffOpen) {
      setOneOffOpen(false);
    }
  }, [showWeeklyAvailability, oneOffOpen]);

  const handleAddOneOff = async () => {
    const ok = await addAvailabilityBlock(selectedDate, newBlock);
    if (ok) {
      setNewBlock(DEFAULT_BLOCK);
      setOneOffOpen(false);
    }
  };

  const handleAddException = async () => {
    const ok = await scheduleExceptions.addException();
    if (ok) {
      await applyWeeklyAvailability({ showToast: false });
    }
  };

  const handleRemoveException = async (id: string) => {
    const ok = await scheduleExceptions.removeException(id);
    if (ok) {
      await applyWeeklyAvailability({ showToast: false });
    }
  };

  const handleRemoveExceptionGroup = async (ids: string[]) => {
    const ok = await scheduleExceptions.removeExceptionGroup(ids);
    if (ok) {
      await applyWeeklyAvailability({ showToast: false });
    }
  };

  const handleResetScheduleFilters = () => {
    setUpcomingRangeDays(defaultUpcomingRangeDays);
    setSourceFilter("all");
    setDayFilter("all");
    setShowFullSchedule(false);
    setScheduleListFilter("all");
    setScheduleWeekDate(new Date());
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading schedule...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          All times are shown in your timezone: <strong>{timezone}</strong>. Clients will see
          these times converted to their own timezone when booking.
        </AlertDescription>
      </Alert>

      <WeeklyAvailabilityCard
        showWeeklyAvailability={showWeeklyAvailability}
        onToggleVisibility={() => setShowWeeklyAvailability((prev) => !prev)}
        availabilityMode={availabilityMode}
        onChangeMode={setAvailabilityMode}
        slotMinutes={slotMinutes}
        applyRangeDays={applyRangeDays}
        onChangeApplyRangeDays={setApplyRangeDays}
        weeklySaving={weeklySaving}
        weeklyLoading={weeklyLoading}
        weekLabel={weekLabel}
        weekStart={weekStart}
        weekDates={weekDates}
        selectedWeekDate={selectedWeekDate}
        onChangeSelectedWeekDate={setSelectedWeekDate}
        timeSlots={timeSlots}
        timeLabels={timeLabels}
        activeGrid={activeGrid}
        onCellPointerDown={handleCellPointerDown}
        onCellPointerEnter={handleCellPointerEnter}
        onPointerUp={handlePointerUp}
        onClearGrid={clearActiveGrid}
        onSaveTemplate={saveWeeklyAvailability}
        onSaveWeek={saveWeekOverride}
        onResetWeek={resetWeekToTemplate}
        oneOffOpen={oneOffOpen}
        onOneOffOpenChange={setOneOffOpen}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        newBlock={newBlock}
        onChangeNewBlock={setNewBlock}
        timeOptions={timeOptions}
        onAddOneOff={handleAddOneOff}
        saving={saving}
      />

      <DaysOffCard
        showDaysOff={showDaysOff}
        onToggleVisibility={() => setShowDaysOff((prev) => !prev)}
        exceptionSelectMode={scheduleExceptions.exceptionSelectMode}
        onChangeSelectMode={scheduleExceptions.setExceptionSelectMode}
        exceptionRange={scheduleExceptions.exceptionRange}
        onChangeRange={scheduleExceptions.setExceptionRange}
        exceptionDates={scheduleExceptions.exceptionDates}
        onChangeDates={scheduleExceptions.setExceptionDates}
        selectedExceptionDates={scheduleExceptions.selectedExceptionDates}
        exceptionReason={scheduleExceptions.exceptionReason}
        onChangeReason={scheduleExceptions.setExceptionReason}
        onAddException={handleAddException}
        onClearSelection={scheduleExceptions.clearExceptionSelection}
        exceptionsLoading={scheduleExceptions.exceptionsLoading}
        exceptionGroups={scheduleExceptions.exceptionGroups}
        timezone={timezone}
        onRemoveException={handleRemoveException}
        onRemoveExceptionGroup={handleRemoveExceptionGroup}
      />

      <ScheduleOverviewCard
        showScheduleOverview={showScheduleOverview}
        onToggleVisibility={() => setShowScheduleOverview((prev) => !prev)}
        defaultUpcomingRangeDays={defaultUpcomingRangeDays}
        defaultSourceFilter="all"
        defaultDayFilter="all"
        defaultScheduleListFilter="all"
        onResetFilters={handleResetScheduleFilters}
        upcomingRangeDays={upcomingRangeDays}
        onChangeUpcomingRangeDays={setUpcomingRangeDays}
        sourceFilter={sourceFilter}
        onChangeSourceFilter={setSourceFilter}
        dayFilter={dayFilter}
        onChangeDayFilter={setDayFilter}
        showFullSchedule={showFullSchedule}
        onToggleShowFullSchedule={setShowFullSchedule}
        scheduleListFilter={scheduleListFilter}
        onChangeScheduleListFilter={setScheduleListFilter}
        scheduleWeekDate={scheduleWeekDate}
        onChangeScheduleWeekDate={setScheduleWeekDate}
        scheduleWeekStart={scheduleWeekStart}
        scheduleWeekLabel={scheduleWeekLabel}
        upcomingEntries={upcomingEntries}
        upcomingBlockCount={upcomingBlockCount}
        fullListEntries={fullListEntries}
        timezone={timezone}
        onDeleteAvailabilityBlock={deleteAvailabilityBlock}
        formatTime={formatTime}
        getSourceLabel={getSourceLabel}
        getSourceBadgeClass={getSourceBadgeClass}
      />
    </div>
  );
}
