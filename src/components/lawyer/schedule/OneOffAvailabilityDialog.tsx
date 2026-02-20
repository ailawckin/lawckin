import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { AvailabilityBlock } from "@/lib/schedule/types";

interface TimeOption {
  value: string;
  label: string;
}

interface OneOffAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSelectDate: (date?: Date) => void;
  newBlock: Partial<AvailabilityBlock>;
  onChangeNewBlock: (block: Partial<AvailabilityBlock>) => void;
  timeOptions: TimeOption[];
  slotMinutes: number;
  saving: boolean;
  onAdd: () => Promise<void> | void;
}

export function OneOffAvailabilityDialog({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
  newBlock,
  onChangeNewBlock,
  timeOptions,
  slotMinutes,
  saving,
  onAdd,
}: OneOffAvailabilityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add one-off time
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add one-off availability</DialogTitle>
          <DialogDescription>
            Add extra times beyond your weekly template. Slots are generated in {slotMinutes}-minute
            increments.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
          <div>
            <Label className="mb-2 block">Pick a Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onSelectDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border w-fit pointer-events-auto"
            />
          </div>
          <div className="space-y-4">
            <div>
              <Label>From</Label>
              <Select
                value={newBlock.start_time}
                onValueChange={(value) => onChangeNewBlock({ ...newBlock, start_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>To</Label>
              <Select
                value={newBlock.end_time}
                onValueChange={(value) => onChangeNewBlock({ ...newBlock, end_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onAdd} disabled={saving || !selectedDate}>
            {saving ? "Adding..." : "Add availability"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
