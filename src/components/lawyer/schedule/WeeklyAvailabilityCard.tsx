import { addDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { OneOffAvailabilityDialog } from "./OneOffAvailabilityDialog";
import { APPLY_RANGE_OPTIONS } from "@/lib/schedule/constants";
import type { AvailabilityBlock, AvailabilityMode } from "@/lib/schedule/types";

interface TimeOption {
  value: string;
  label: string;
}

interface WeeklyAvailabilityCardProps {
  showWeeklyAvailability: boolean;
  onToggleVisibility: () => void;
  availabilityMode: AvailabilityMode;
  onChangeMode: (mode: AvailabilityMode) => void;
  slotMinutes: number;
  applyRangeDays: number;
  onChangeApplyRangeDays: (value: number) => void;
  weeklySaving: boolean;
  weeklyLoading: boolean;
  weekLabel: string;
  weekStart: Date;
  weekDates: Date[];
  selectedWeekDate: Date;
  onChangeSelectedWeekDate: (date: Date) => void;
  timeSlots: number[];
  timeLabels: string[];
  activeGrid: Record<number, boolean[]>;
  onCellPointerDown: (dayValue: number, slotIndex: number) => void;
  onCellPointerEnter: (dayValue: number, slotIndex: number) => void;
  onPointerUp: () => void;
  onClearGrid: () => void;
  onSaveTemplate: () => void;
  onSaveWeek: () => void;
  onResetWeek: () => void;
  oneOffOpen: boolean;
  onOneOffOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSelectDate: (date?: Date) => void;
  newBlock: Partial<AvailabilityBlock>;
  onChangeNewBlock: (block: Partial<AvailabilityBlock>) => void;
  timeOptions: TimeOption[];
  onAddOneOff: () => Promise<void> | void;
  saving: boolean;
}

export function WeeklyAvailabilityCard({
  showWeeklyAvailability,
  onToggleVisibility,
  availabilityMode,
  onChangeMode,
  slotMinutes,
  applyRangeDays,
  onChangeApplyRangeDays,
  weeklySaving,
  weeklyLoading,
  weekLabel,
  weekStart,
  weekDates,
  selectedWeekDate,
  onChangeSelectedWeekDate,
  timeSlots,
  timeLabels,
  activeGrid,
  onCellPointerDown,
  onCellPointerEnter,
  onPointerUp,
  onClearGrid,
  onSaveTemplate,
  onSaveWeek,
  onResetWeek,
  oneOffOpen,
  onOneOffOpenChange,
  selectedDate,
  onSelectDate,
  newBlock,
  onChangeNewBlock,
  timeOptions,
  onAddOneOff,
  saving,
}: WeeklyAvailabilityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Weekly Availability</CardTitle>
            <CardDescription>
              {availabilityMode === "template"
                ? "Set your standard weekly hours. We'll apply this template to future dates."
                : "Edit a specific week. Changes here override your template."}
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onToggleVisibility}>
            {showWeeklyAvailability ? "Hide" : "Show"}
          </Button>
          {showWeeklyAvailability && (
            <OneOffAvailabilityDialog
              open={oneOffOpen}
              onOpenChange={onOneOffOpenChange}
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              newBlock={newBlock}
              onChangeNewBlock={onChangeNewBlock}
              timeOptions={timeOptions}
              slotMinutes={slotMinutes}
              saving={saving}
              onAdd={onAddOneOff}
            />
          )}
        </div>
      </CardHeader>
      {showWeeklyAvailability && (
        <CardContent className="space-y-4" onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={availabilityMode === "template" ? "default" : "outline"}
                onClick={() => onChangeMode("template")}
              >
                Template
              </Button>
              <Button
                type="button"
                variant={availabilityMode === "week" ? "default" : "outline"}
                onClick={() => onChangeMode("week")}
              >
                Specific week
              </Button>
            </div>
            <Button type="button" variant="ghost" onClick={onClearGrid}>
              Clear all
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Click and drag to set availability. Slot length: {slotMinutes} minutes.
            </p>
            {availabilityMode === "week" && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onChangeSelectedWeekDate(addDays(weekStart, -7))}
                >
                  Prev
                </Button>
                <span className="font-medium">Week of {weekLabel}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onChangeSelectedWeekDate(addDays(weekStart, 7))}
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
                      selected={selectedWeekDate}
                      onSelect={(date) => date && onChangeSelectedWeekDate(date)}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {weeklyLoading ? (
            <p className="text-sm text-muted-foreground">Loading weekly availability...</p>
          ) : (
            <AvailabilityGrid
              availabilityMode={availabilityMode}
              weekDates={weekDates}
              timeSlots={timeSlots}
              timeLabels={timeLabels}
              activeGrid={activeGrid}
              onCellPointerDown={onCellPointerDown}
              onCellPointerEnter={onCellPointerEnter}
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            {availabilityMode === "template" ? (
              <>
                <div className="min-w-[220px]">
                  <Label className="text-xs text-muted-foreground">Apply range</Label>
                  <Select
                    value={String(applyRangeDays)}
                    onValueChange={(value) => onChangeApplyRangeDays(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLY_RANGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={onSaveTemplate} disabled={weeklySaving || weeklyLoading}>
                  {weeklySaving ? "Saving..." : "Save & Apply"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onResetWeek} disabled={weeklySaving || weeklyLoading}>
                  Reset to template
                </Button>
                <Button onClick={onSaveWeek} disabled={weeklySaving || weeklyLoading}>
                  {weeklySaving ? "Saving..." : "Save week"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
