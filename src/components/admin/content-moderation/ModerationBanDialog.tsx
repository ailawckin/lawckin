import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { getEntityTypeLabel } from "@/components/admin/content-moderation/utils";
import type { ReportedItem } from "@/components/admin/content-moderation/types";

interface ModerationBanDialogProps {
  open: boolean;
  actionNotes: string;
  selectedReport: ReportedItem | null;
  onNotesChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ModerationBanDialog({
  open,
  actionNotes,
  selectedReport,
  onNotesChange,
  onOpenChange,
  onConfirm,
}: ModerationBanDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to ban this user? This action cannot be easily undone.
            {selectedReport && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  Entity: {getEntityTypeLabel(selectedReport.entity_type)}
                </p>
                <p className="text-sm text-muted-foreground">Reason: {selectedReport.reason}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Add notes about why this user is being banned..."
            value={actionNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Ban User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
