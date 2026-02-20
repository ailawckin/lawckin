import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MessageItem } from "@/components/lawyer/dashboard/types";
import {
  getMessageAttachmentPath,
  getMessageUploadErrorMessage,
  isPublicMessageAttachmentUrl,
} from "@/lib/messages/utils";

interface UseMessageComposerParams {
  userId: string | null;
  activeConversationId: string | null;
  messageThreads: Record<string, MessageItem[]>;
  setMessageThreads: Dispatch<SetStateAction<Record<string, MessageItem[]>>>;
  fetchMessageConversations: () => Promise<void>;
  isNearBottom: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useMessageComposer({
  userId,
  activeConversationId,
  messageThreads,
  setMessageThreads,
  fetchMessageConversations,
  isNearBottom,
  scrollToBottom,
  toast,
}: UseMessageComposerParams) {
  const [messageDraft, setMessageDraft] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [messageBucketAvailable, setMessageBucketAvailable] = useState(true);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const pendingAttachmentRef = useRef<Record<string, File>>({});

  const ensureMessageBucket = async () => {
    try {
      const { error } = await supabase.storage.from("message-attachments").list("", { limit: 1 });
      return !error;
    } catch {
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!activeConversationId || (!messageDraft.trim() && !attachmentFile) || !userId) return;
    if (attachmentFile && !messageBucketAvailable) {
      toast({
        title: "Attachments unavailable",
        description: "Message attachments are not configured. Contact support.",
        variant: "destructive",
      });
      return;
    }
    if (messageSending) return;
    const tempId = `temp-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const pendingMessage: MessageItem = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: userId,
      content: messageDraft.trim(),
      status: "sent",
      created_at: createdAt,
      attachment_name: attachmentFile?.name || null,
      attachment_size: attachmentFile?.size || null,
      attachment_type: attachmentFile?.type || null,
      local_status: "pending",
    };

    setMessageThreads((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), pendingMessage],
    }));
    if (isNearBottom) {
      scrollToBottom();
    }
    setMessageSending(true);
    try {
      let attachmentUrl: string | null = null;
      let uploadPath: string | null = null;
      if (attachmentFile) {
        const bucketReady = await ensureMessageBucket();
        if (!bucketReady) {
          setMessageBucketAvailable(false);
          throw new Error("Message attachments storage is not configured.");
        }
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(attachmentFile.type)) {
          throw new Error("Unsupported attachment type.");
        }
        if (attachmentFile.size > 10 * 1024 * 1024) {
          throw new Error("Attachment is too large (max 10MB).");
        }

        setAttachmentUploading(true);
        const fileExt = attachmentFile.name.split(".").pop();
        const filePath = `${activeConversationId}/${userId}-${Date.now()}.${fileExt}`;
        uploadPath = filePath;
        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(filePath, attachmentFile);
        if (uploadError) {
          if (uploadError.message?.toLowerCase().includes("bucket")) {
            setMessageBucketAvailable(false);
          }
          throw new Error(getMessageUploadErrorMessage(uploadError));
        }
        attachmentUrl = filePath;
        pendingAttachmentRef.current[tempId] = attachmentFile;
      }

      let insertPayload: any = {
        conversation_id: activeConversationId,
        sender_id: userId,
        content: messageDraft.trim() || "",
      };
      if (attachmentUrl) {
        insertPayload = {
          ...insertPayload,
          attachment_url: attachmentUrl,
          attachment_name: attachmentFile?.name || null,
          attachment_size: attachmentFile?.size || null,
          attachment_type: attachmentFile?.type || null,
        };
      }

      let { data, error } = await supabase.from("messages").insert(insertPayload).select().single();

      if (error) {
        const message = error.message || "";
        if (attachmentUrl && message.includes("schema cache")) {
          insertPayload = {
            conversation_id: activeConversationId,
            sender_id: userId,
            content: messageDraft.trim() || "",
            attachment_url: attachmentUrl,
          };
          const retry = await supabase.from("messages").insert(insertPayload).select().single();
          data = retry.data;
          error = retry.error as any;
        }
      }

      if (error) {
        if (uploadPath) {
          await supabase.storage.from("message-attachments").remove([uploadPath]);
        }
        throw error;
      }
      setMessageDraft("");
      setAttachmentFile(null);
      delete pendingAttachmentRef.current[tempId];

      setMessageThreads((prev) => ({
        ...prev,
        [activeConversationId]: Array.from(
          new Map(
            (prev[activeConversationId] || [])
              .map((message) => (message.id === tempId ? { ...(data as MessageItem) } : message))
              .map((message) => [message.id, message])
          ).values()
        ),
      }));
      await fetchMessageConversations();
    } catch (error: any) {
      setMessageThreads((prev) => ({
        ...prev,
        [activeConversationId]: (prev[activeConversationId] || []).map((message) =>
          message.id === tempId ? { ...message, local_status: "failed" } : message
        ),
      }));
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMessageSending(false);
      setAttachmentUploading(false);
    }
  };

  const handleRetryMessage = async (failedMessage: MessageItem) => {
    if (!activeConversationId || !userId) return;
    setMessageThreads((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map((message) =>
        message.id === failedMessage.id ? { ...message, local_status: "pending" } : message
      ),
    }));
    try {
      let attachmentUrl: string | null = failedMessage.attachment_url || null;
      const pendingFile = pendingAttachmentRef.current[failedMessage.id];
      if (pendingFile && !attachmentUrl) {
        const fileExt = pendingFile.name.split(".").pop();
        const filePath = `${activeConversationId}/${userId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(filePath, pendingFile);
        if (!uploadError) {
          attachmentUrl = filePath;
        } else {
          throw new Error(getMessageUploadErrorMessage(uploadError));
        }
      }

      let insertPayload: any = {
        conversation_id: activeConversationId,
        sender_id: userId,
        content: failedMessage.content,
      };
      if (attachmentUrl) {
        insertPayload = {
          ...insertPayload,
          attachment_url: attachmentUrl,
          attachment_name: failedMessage.attachment_name || null,
          attachment_size: failedMessage.attachment_size || null,
          attachment_type: failedMessage.attachment_type || null,
        };
      }

      let { data, error } = await supabase.from("messages").insert(insertPayload).select().single();

      if (error) {
        const message = error.message || "";
        if (attachmentUrl && message.includes("schema cache")) {
          insertPayload = {
            conversation_id: activeConversationId,
            sender_id: userId,
            content: failedMessage.content,
            attachment_url: attachmentUrl,
          };
          const retry = await supabase.from("messages").insert(insertPayload).select().single();
          data = retry.data;
          error = retry.error as any;
        }
      }
      if (error) throw error;

      setMessageThreads((prev) => ({
        ...prev,
        [activeConversationId]: Array.from(
          new Map(
            (prev[activeConversationId] || [])
              .map((message) =>
                message.id === failedMessage.id ? { ...(data as MessageItem) } : message
              )
              .map((message) => [message.id, message])
          ).values()
        ),
      }));
      await fetchMessageConversations();
    } catch (error: any) {
      setMessageThreads((prev) => ({
        ...prev,
        [activeConversationId]: (prev[activeConversationId] || []).map((message) =>
          message.id === failedMessage.id ? { ...message, local_status: "failed" } : message
        ),
      }));
      toast({
        title: "Retry failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!activeConversationId) return;
    const messages = messageThreads[activeConversationId] || [];
    const missing = messages.filter(
      (message) => message.attachment_url && !attachmentUrls[message.id]
    );
    if (missing.length === 0) return;

    const resolve = async () => {
      const updates: Record<string, string> = {};
      for (const message of missing) {
        const raw = message.attachment_url || "";
        const path = getMessageAttachmentPath(raw);
        if (!path) {
          if (isPublicMessageAttachmentUrl(raw)) {
            updates[message.id] = raw;
          }
          continue;
        }
        const { data, error } = await supabase.storage
          .from("message-attachments")
          .createSignedUrl(path, 60 * 60);
        if (!error && data?.signedUrl) {
          updates[message.id] = data.signedUrl;
        }
      }
      if (Object.keys(updates).length > 0) {
        setAttachmentUrls((prev) => ({ ...prev, ...updates }));
      }
    };

    void resolve();
  }, [activeConversationId, messageThreads, attachmentUrls]);

  return {
    messageDraft,
    setMessageDraft,
    messageSending,
    handleSendMessage,
    handleRetryMessage,
    attachmentFile,
    setAttachmentFile,
    attachmentUploading,
    messageBucketAvailable,
    setMessageBucketAvailable,
    attachmentUrls,
    ensureMessageBucket,
  };
}
