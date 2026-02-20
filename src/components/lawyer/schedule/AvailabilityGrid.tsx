import { format } from "date-fns";
import { WEEK_DAYS } from "@/lib/schedule/constants";
import type { AvailabilityMode } from "@/lib/schedule/types";

interface AvailabilityGridProps {
  availabilityMode: AvailabilityMode;
  weekDates: Date[];
  timeSlots: number[];
  timeLabels: string[];
  activeGrid: Record<number, boolean[]>;
  onCellPointerDown: (dayValue: number, slotIndex: number) => void;
  onCellPointerEnter: (dayValue: number, slotIndex: number) => void;
}

export function AvailabilityGrid({
  availabilityMode,
  weekDates,
  timeSlots,
  timeLabels,
  activeGrid,
  onCellPointerDown,
  onCellPointerEnter,
}: AvailabilityGridProps) {
  return (
    <div className="overflow-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] gap-px rounded-md border bg-border text-xs select-none">
          <div className="bg-background px-2 py-2 text-muted-foreground">Time</div>
          {WEEK_DAYS.map((day, idx) => (
            <div key={day.value} className="bg-background px-2 py-2 text-center font-medium">
              {availabilityMode === "week"
                ? `${day.label.slice(0, 3)} ${format(weekDates[idx], "M/d")}`
                : day.label.slice(0, 3)}
            </div>
          ))}
          {timeSlots.map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="contents">
              <div className="bg-background px-2 py-1 text-muted-foreground">
                {timeLabels[rowIndex]}
              </div>
              {WEEK_DAYS.map((day) => {
                const selected = activeGrid[day.value]?.[rowIndex] || false;
                return (
                  <button
                    key={`${day.value}-${rowIndex}`}
                    type="button"
                    className={`h-7 w-full transition-colors ${
                      selected
                        ? "bg-primary/70 hover:bg-primary/80"
                        : "bg-background hover:bg-muted"
                    }`}
                    onPointerDown={() => onCellPointerDown(day.value, rowIndex)}
                    onPointerEnter={() => onCellPointerEnter(day.value, rowIndex)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
