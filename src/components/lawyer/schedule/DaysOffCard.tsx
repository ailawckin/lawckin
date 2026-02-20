import { formatInTimeZone } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExceptionSelectMode } from "@/lib/schedule/types";

interface ExceptionGroup {
  ids: string[];
  start: string;
  end: string;
  reason?: string | null;
}

interface DaysOffCardProps {
  showDaysOff: boolean;
  onToggleVisibility: () => void;
  exceptionSelectMode: ExceptionSelectMode;
  onChangeSelectMode: (mode: ExceptionSelectMode) => void;
  exceptionRange: { from?: Date; to?: Date };
  onChangeRange: (value: { from?: Date; to?: Date }) => void;
  exceptionDates: Date[];
  onChangeDates: (dates: Date[]) => void;
  selectedExceptionDates: Date[];
  exceptionReason: string;
  onChangeReason: (value: string) => void;
  onAddException: () => void;
  onClearSelection: () => void;
  exceptionsLoading: boolean;
  exceptionGroups: ExceptionGroup[];
  timezone: string;
  onRemoveException: (id: string) => void;
  onRemoveExceptionGroup: (ids: string[]) => void;
}

export function DaysOffCard({
  showDaysOff,
  onToggleVisibility,
  exceptionSelectMode,
  onChangeSelectMode,
  exceptionRange,
  onChangeRange,
  exceptionDates,
  onChangeDates,
  selectedExceptionDates,
  exceptionReason,
  onChangeReason,
  onAddException,
  onClearSelection,
  exceptionsLoading,
  exceptionGroups,
  timezone,
  onRemoveException,
  onRemoveExceptionGroup,
}: DaysOffCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Days Off</CardTitle>
            <CardDescription>Block full days from your weekly template.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onToggleVisibility}>
            {showDaysOff ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      {showDaysOff && (
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Label>Pick dates</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={exceptionSelectMode === "range" ? "default" : "outline"}
                    onClick={() => onChangeSelectMode("range")}
                  >
                    Date range
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={exceptionSelectMode === "multiple" ? "default" : "outline"}
                    onClick={() => onChangeSelectMode("multiple")}
                  >
                    Multiple
                  </Button>
                </div>
              </div>
              <Calendar
                mode={exceptionSelectMode}
                selected={exceptionSelectMode === "range" ? exceptionRange : exceptionDates}
                onSelect={(value) => {
                  if (exceptionSelectMode === "range") {
                    onChangeRange(value as { from?: Date; to?: Date });
                  } else {
                    onChangeDates((value as Date[]) ?? []);
                  }
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border w-fit pointer-events-auto"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  onClick={onAddException}
                  className="flex-1"
                  disabled={selectedExceptionDates.length === 0}
                >
                  Add Days Off
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClearSelection}
                  disabled={selectedExceptionDates.length === 0}
                >
                  Clear
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                <Label className="text-xs text-muted-foreground">Reason (optional)</Label>
                <Input
                  value={exceptionReason}
                  onChange={(event) => onChangeReason(event.target.value)}
                  placeholder="Vacation, court appearance, travel..."
                />
                <p className="text-xs text-muted-foreground">Applies to all selected dates.</p>
              </div>
              {selectedExceptionDates.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Selected: {selectedExceptionDates.length} day
                  {selectedExceptionDates.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="mb-2 block">Upcoming Days Off</Label>
              {exceptionsLoading ? (
                <p className="text-sm text-muted-foreground">Loading days off...</p>
              ) : exceptionGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No days off scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {exceptionGroups.map((group) => {
                    const startDate = formatInTimeZone(
                      new Date(`${group.start}T00:00:00`),
                      timezone,
                      "MMM d, yyyy"
                    );
                    const endDate = formatInTimeZone(
                      new Date(`${group.end}T00:00:00`),
                      timezone,
                      "MMM d, yyyy"
                    );
                    const rangeLabel =
                      group.start === group.end ? startDate : `${startDate} – ${endDate}`;
                    const totalDays =
                      group.ids.length === 1 ? "1 day" : `${group.ids.length} days`;

                    return (
                      <div
                        key={`${group.start}-${group.end}-${group.ids.length}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <span className="text-sm font-medium">{rangeLabel}</span>
                          <div className="text-xs text-muted-foreground">{totalDays}</div>
                          {group.reason && (
                            <div className="text-xs text-muted-foreground">
                              Reason: {group.reason}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            group.ids.length === 1
                              ? onRemoveException(group.ids[0])
                              : onRemoveExceptionGroup(group.ids)
                          }
                        >
                          {group.ids.length === 1 ? "Remove" : "Remove range"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
