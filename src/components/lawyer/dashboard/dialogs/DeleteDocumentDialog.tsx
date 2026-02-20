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
import type { VerificationDocument } from "@/components/lawyer/dashboard/types";

interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docToDelete: VerificationDocument | null;
  setDocToDelete: (value: VerificationDocument | null) => void;
  onRemove: (doc: VerificationDocument) => Promise<void> | void;
}

const DeleteDocumentDialog = ({
  open,
  onOpenChange,
  docToDelete,
  setDocToDelete,
  onRemove,
}: DeleteDocumentDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this document? You can upload a replacement afterward.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDocToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (docToDelete) {
                await onRemove(docToDelete);
              }
              setDocToDelete(null);
              onOpenChange(false);
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDocumentDialog;
