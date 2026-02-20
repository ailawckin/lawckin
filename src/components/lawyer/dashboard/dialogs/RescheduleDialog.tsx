import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultation: any | null;
  rescheduleDate: Date | undefined;
  setRescheduleDate: (value: Date | undefined) => void;
  rescheduleSlots: any[];
  rescheduleSlotId: string;
  setRescheduleSlotId: (value: string) => void;
  rescheduleReason: string;
  setRescheduleReason: (value: string) => void;
  rescheduling: boolean;
  formatConsultationDateTime: (value: string) => string;
  formatConsultationTime: (value: string) => string;
  onConfirm: () => void;
}

const RescheduleDialog = ({
  open,
  onOpenChange,
  consultation,
  rescheduleDate,
  setRescheduleDate,
  rescheduleSlots,
  rescheduleSlotId,
  setRescheduleSlotId,
  rescheduleReason,
  setRescheduleReason,
  rescheduling,
  formatConsultationDateTime,
  formatConsultationTime,
  onConfirm,
}: RescheduleDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule Consultation</DialogTitle>
          <DialogDescription>
            Pick a new time and optionally add a note for the client.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label>Current time</Label>
            <div className="text-sm text-muted-foreground">
              {consultation?.scheduled_at
                ? formatConsultationDateTime(consultation.scheduled_at)
                : "Not scheduled"}
            </div>
            <Label className="mt-4">New date</Label>
            <CalendarPicker
              mode="single"
              selected={rescheduleDate}
              onSelect={setRescheduleDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New time slot</Label>
              <Select value={rescheduleSlotId} onValueChange={setRescheduleSlotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a new time" />
                </SelectTrigger>
                <SelectContent>
                  {rescheduleSlots.length === 0 ? (
                    <SelectItem value="no-slots" disabled>
                      No available slots
                    </SelectItem>
                  ) : (
                    rescheduleSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {formatConsultationTime(slot.start_time)} - {formatConsultationTime(slot.end_time)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                rows={4}
                value={rescheduleReason}
                onChange={(event) => setRescheduleReason(event.target.value)}
                placeholder="Add a short note for the client"
              />
            </div>
            <Button onClick={onConfirm} disabled={!rescheduleSlotId || rescheduling}>
              {rescheduling ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
