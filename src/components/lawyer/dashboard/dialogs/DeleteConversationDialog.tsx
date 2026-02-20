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

interface DeleteConversationDialogProps {
  deleteConversationId: string | null;
  setDeleteConversationId: (value: string | null) => void;
  deletingConversation: boolean;
  handleDeleteConversation: () => void;
}

const DeleteConversationDialog = ({
  deleteConversationId,
  setDeleteConversationId,
  deletingConversation,
  handleDeleteConversation,
}: DeleteConversationDialogProps) => {
  return (
    <AlertDialog
      open={Boolean(deleteConversationId)}
      onOpenChange={(open) => {
        if (!open) setDeleteConversationId(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete conversation</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the chat and its messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingConversation}>Keep conversation</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConversation} disabled={deletingConversation}>
            {deletingConversation ? "Deleting..." : "Delete conversation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConversationDialog;
