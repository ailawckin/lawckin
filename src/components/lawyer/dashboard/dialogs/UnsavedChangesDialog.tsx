import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDiscarding: boolean;
  onDiscard: () => void | Promise<void>;
  onSave: () => void;
  onCancel: () => void;
}

const UnsavedChangesDialog = ({
  open,
  onOpenChange,
  isDiscarding,
  onDiscard,
  onSave,
  onCancel,
}: UnsavedChangesDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes in settings. Save or discard before leaving.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <Button variant="outline" disabled={isDiscarding} onClick={onDiscard}>
            {isDiscarding ? (
              <>
                <Loader2 className="h-3.5 w-3 mr-1.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Discarding…</span>
              </>
            ) : (
              "Discard changes"
            )}
          </Button>
          <AlertDialogAction onClick={onSave}>Save changes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UnsavedChangesDialog;
