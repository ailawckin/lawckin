import { useEffect, type RefObject, useState } from "react";

interface UseMessageScrollParams {
  messageListRef: RefObject<HTMLDivElement | null>;
  activeConversationId: string | null;
  markConversationRead: (conversationId: string) => void | Promise<void>;
}

export function useMessageScroll({
  messageListRef,
  activeConversationId,
  markConversationRead,
}: UseMessageScrollParams) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollToBottom = (smooth = true) => {
    if (!messageListRef.current) return;
    const container = messageListRef.current;
    const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  useEffect(() => {
    if (!messageListRef.current) return;
    const handleScroll = () => {
      const container = messageListRef.current;
      if (!container) return;
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
      setIsNearBottom(atBottom);
      if (atBottom) {
        setShowScrollToBottom(false);
        if (activeConversationId) {
          markConversationRead(activeConversationId);
        }
      }
    };
    const container = messageListRef.current;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messageListRef, activeConversationId, markConversationRead]);

  return {
    messageListRef,
    showScrollToBottom,
    setShowScrollToBottom,
    isNearBottom,
    scrollToBottom,
  };
}
