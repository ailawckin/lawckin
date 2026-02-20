import { type Dispatch, type RefObject, type SetStateAction, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MessageItem, MessageThreadMeta } from "@/components/lawyer/dashboard/types";

interface UseMessageThreadsParams {
  userId: string | null;
  messageConversations: any[];
  setMessageConversations: Dispatch<SetStateAction<any[]>>;
  messageListRef: RefObject<HTMLDivElement | null>;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useMessageThreads({
  userId,
  messageConversations,
  setMessageConversations,
  messageListRef,
  toast,
}: UseMessageThreadsParams) {
  const [messageThreads, setMessageThreads] = useState<Record<string, MessageItem[]>>({});
  const [messageThreadMeta, setMessageThreadMeta] = useState<Record<string, MessageThreadMeta>>({});
  const [markingReadConversationId, setMarkingReadConversationId] = useState<string | null>(null);

  const fetchConversationMessages = async (
    conversationId: string,
    options: { loadMore?: boolean } = {}
  ) => {
    const limit = 50;
    try {
      const container = messageListRef.current;
      const beforeHeight = options.loadMore ? container?.scrollHeight : null;
      const beforeTop = options.loadMore ? container?.scrollTop || 0 : 0;
      setMessageThreadMeta((prev) => ({
        ...prev,
        [conversationId]: {
          ...(prev[conversationId] || { hasMore: true }),
          loading: true,
        },
      }));

      const oldest = messageThreadMeta[conversationId]?.oldest;
      let query = supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (options.loadMore && oldest) {
        query = query.lt("created_at", oldest);
      }

      const { data, error } = await query;

      if (error) throw error;

      const nextBatch = (data || []).reverse();
      setMessageThreads((prev) => ({
        ...prev,
        [conversationId]: options.loadMore
          ? [...nextBatch, ...(prev[conversationId] || [])]
          : nextBatch,
      }));

      if (!options.loadMore && nextBatch.length > 0) {
        const latest = nextBatch[nextBatch.length - 1];
        setMessageConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  last_message_at: latest.created_at,
                  last_message_preview: latest.content || "Attachment",
                  last_message_sender_id: latest.sender_id,
                }
              : conv
          )
        );
      }

      if (options.loadMore && container && beforeHeight !== null) {
        setTimeout(() => {
          const afterHeight = container.scrollHeight;
          container.scrollTop = afterHeight - beforeHeight + beforeTop;
        }, 0);
      }

      const newOldest = nextBatch[0]?.created_at || oldest;
      setMessageThreadMeta((prev) => ({
        ...prev,
        [conversationId]: {
          hasMore: (data || []).length === limit,
          loading: false,
          oldest: newOldest,
        },
      }));
    } catch (error: any) {
      setMessageThreadMeta((prev) => ({
        ...prev,
        [conversationId]: {
          ...(prev[conversationId] || { hasMore: false }),
          loading: false,
        },
      }));
      toast({
        title: "Failed to load conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markConversationRead = async (conversationId: string) => {
    if (!userId) return;
    if (markingReadConversationId === conversationId) return;
    const conversation = messageConversations.find((conv) => conv.id === conversationId);
    if (conversation && (conversation.unread_count || 0) === 0) return;
    setMarkingReadConversationId(conversationId);
    await supabase
      .from("messages")
      .update({ status: "read" })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId);

    setMessageConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv))
    );
    setMessageThreads((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((message) =>
        message.sender_id === userId ? message : { ...message, status: "read" }
      ),
    }));
    setMarkingReadConversationId(null);
  };

  return {
    messageThreads,
    setMessageThreads,
    messageThreadMeta,
    setMessageThreadMeta,
    markingReadConversationId,
    fetchConversationMessages,
    markConversationRead,
  };
}
