import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MessageItem } from "@/components/lawyer/dashboard/types";

interface UseMessageRealtimeParams {
  userId: string | null;
  activeConversationId: string | null;
  messageConversations: any[];
  setMessageConversations: Dispatch<SetStateAction<any[]>>;
  setMessageThreads: Dispatch<SetStateAction<Record<string, MessageItem[]>>>;
  fetchMessageConversations: () => Promise<void>;
  markConversationRead: (conversationId: string) => void;
  scrollToBottom: (smooth?: boolean) => void;
  isNearBottom: boolean;
  setShowScrollToBottom: (value: boolean) => void;
}

export function useMessageRealtime({
  userId,
  activeConversationId,
  messageConversations,
  setMessageConversations,
  setMessageThreads,
  fetchMessageConversations,
  markConversationRead,
  scrollToBottom,
  isNearBottom,
  setShowScrollToBottom,
}: UseMessageRealtimeParams) {
  const [typingIndicator, setTypingIndicator] = useState<Record<string, boolean>>({});
  const typingChannelRef = useRef<any>(null);
  const typingLastSentRef = useRef(0);
  const realtimeActiveConversationRef = useRef<string | null>(null);
  const realtimeNearBottomRef = useRef(true);
  const realtimeConversationsRef = useRef<any[]>([]);

  useEffect(() => {
    realtimeActiveConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    realtimeNearBottomRef.current = isNearBottom;
  }, [isNearBottom]);

  useEffect(() => {
    realtimeConversationsRef.current = messageConversations;
  }, [messageConversations]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`lawyer-messages-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new as MessageItem;
          const inList = realtimeConversationsRef.current.some(
            (conversation) => conversation.id === newMessage.conversation_id
          );

          setMessageThreads((prev) => {
            const existing = prev[newMessage.conversation_id] || [];
            const alreadyExists = existing.some((message) => message.id === newMessage.id);
            if (alreadyExists) return prev;
            return {
              ...prev,
              [newMessage.conversation_id]: [...existing, newMessage],
            };
          });

          setMessageConversations((prev) => {
            const updated = prev.map((conv) =>
              conv.id === newMessage.conversation_id
                ? {
                    ...conv,
                    last_message_at: newMessage.created_at,
                    last_message_preview: newMessage.content || "Attachment",
                    last_message_sender_id: newMessage.sender_id,
                    unread_count:
                      newMessage.sender_id !== userId &&
                      realtimeActiveConversationRef.current !== conv.id
                        ? (conv.unread_count || 0) + 1
                        : conv.unread_count || 0,
                  }
                : conv
            );
            return updated.sort((a, b) => {
              const aTime = a.last_message_at || a.updated_at;
              const bTime = b.last_message_at || b.updated_at;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            });
          });

          if (!inList) {
            fetchMessageConversations();
          }

          if (newMessage.conversation_id === realtimeActiveConversationRef.current) {
            if (realtimeNearBottomRef.current) {
              markConversationRead(newMessage.conversation_id);
              scrollToBottom();
            } else {
              setShowScrollToBottom(true);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updatedMessage = payload.new as MessageItem;
          setMessageThreads((prev) => ({
            ...prev,
            [updatedMessage.conversation_id]: (prev[updatedMessage.conversation_id] || []).map(
              (message) => (message.id === updatedMessage.id ? updatedMessage : message)
            ),
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          fetchMessageConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!activeConversationId) return;
    const channel = supabase.channel(`typing-${activeConversationId}`);
    typingChannelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload?.payload?.sender_id === userId) return;
        setTypingIndicator((prev) => ({ ...prev, [activeConversationId]: true }));
        setTimeout(() => {
          setTypingIndicator((prev) => ({ ...prev, [activeConversationId]: false }));
        }, 3000);
      })
      .subscribe();

    return () => {
      typingChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, userId]);

  return {
    typingIndicator,
    typingChannelRef,
    typingLastSentRef,
  };
}
