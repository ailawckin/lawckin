import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getEntityTypeLabel } from "@/components/admin/content-moderation/utils";
import type { ReportedItem } from "@/components/admin/content-moderation/types";

interface ModerationActionDialogProps {
  open: boolean;
  actionType: "dismiss" | "hide" | "delete" | "ban";
  actionNotes: string;
  selectedReport: ReportedItem | null;
  onNotesChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ModerationActionDialog({
  open,
  actionType,
  actionNotes,
  selectedReport,
  onNotesChange,
  onOpenChange,
  onConfirm,
}: ModerationActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === "dismiss" && "Dismiss Report"}
            {actionType === "hide" && "Hide Content"}
            {actionType === "delete" && "Delete Content"}
          </DialogTitle>
          <DialogDescription>
            {selectedReport && (
              <div className="mt-2 space-y-2">
                <p className="font-medium">
                  Entity: {getEntityTypeLabel(selectedReport.entity_type)}
                </p>
                <p className="text-sm text-muted-foreground">Reason: {selectedReport.reason}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Add notes about this action (optional)..."
            value={actionNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant={actionType === "delete" ? "destructive" : "default"}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
