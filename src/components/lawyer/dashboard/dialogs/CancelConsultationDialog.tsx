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

interface CancelConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultation: any | null;
  onConfirm: () => void;
  formatConsultationDateTime: (value: string) => string;
}

const CancelConsultationDialog = ({
  open,
  onOpenChange,
  consultation,
  onConfirm,
  formatConsultationDateTime,
}: CancelConsultationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Consultation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this consultation? The client will be notified immediately.
            {consultation && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  Client: {consultation.profiles?.full_name || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {consultation.scheduled_at && formatConsultationDateTime(consultation.scheduled_at)}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Consultation</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Cancel Consultation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelConsultationDialog;
