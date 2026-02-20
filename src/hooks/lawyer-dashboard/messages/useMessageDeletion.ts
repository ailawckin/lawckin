import { useState, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MessageItem, MessageThreadMeta } from "@/components/lawyer/dashboard/types";

interface UseMessageDeletionParams {
  activeConversationId: string | null;
  setActiveConversationId: (value: string | null) => void;
  setMessageConversations: Dispatch<SetStateAction<any[]>>;
  setMessageThreads: Dispatch<SetStateAction<Record<string, MessageItem[]>>>;
  setMessageThreadMeta: Dispatch<SetStateAction<Record<string, MessageThreadMeta>>>;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useMessageDeletion({
  activeConversationId,
  setActiveConversationId,
  setMessageConversations,
  setMessageThreads,
  setMessageThreadMeta,
  toast,
}: UseMessageDeletionParams) {
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null);
  const [deletingConversation, setDeletingConversation] = useState(false);

  const handleDeleteConversation = async () => {
    if (!deleteConversationId) return;
    setDeletingConversation(true);
    try {
      let offset = 0;
      const allPaths: string[] = [];
      while (true) {
        const { data, error } = await supabase.storage
          .from("message-attachments")
          .list(deleteConversationId, { limit: 100, offset });
        if (error) {
          toast({
            title: "Attachment cleanup skipped",
            description: "Unable to list message attachments for this chat.",
            variant: "destructive",
          });
          break;
        }
        const batch = (data || [])
          .filter((item) => item.name && item.name !== ".emptyFolderPlaceholder")
          .map((item) => `${deleteConversationId}/${item.name}`);
        allPaths.push(...batch);
        if (!data || data.length < 100) break;
        offset += 100;
      }

      if (allPaths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from("message-attachments")
          .remove(allPaths);
        if (removeError) {
          toast({
            title: "Attachment cleanup skipped",
            description: "Unable to delete some chat attachments.",
            variant: "destructive",
          });
        }
      }

      const { error } = await supabase.from("conversations").delete().eq("id", deleteConversationId);
      if (error) throw error;

      setMessageConversations((prev) => prev.filter((conv) => conv.id !== deleteConversationId));
      setMessageThreads((prev) => {
        const next = { ...prev };
        delete next[deleteConversationId];
        return next;
      });
      setMessageThreadMeta((prev) => {
        const next = { ...prev };
        delete next[deleteConversationId];
        return next;
      });
      if (activeConversationId === deleteConversationId) {
        setActiveConversationId(null);
      }
      toast({
        title: "Conversation deleted",
        description: "The chat and its messages were removed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete conversation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingConversation(false);
      setDeleteConversationId(null);
    }
  };

  return {
    deleteConversationId,
    setDeleteConversationId,
    deletingConversation,
    handleDeleteConversation,
  };
}
