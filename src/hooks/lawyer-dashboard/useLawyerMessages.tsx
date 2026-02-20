import { useEffect, useMemo, useRef, useState } from "react";
import { useMessageClients } from "@/hooks/lawyer-dashboard/messages/useMessageClients";
import { useMessageComposer } from "@/hooks/lawyer-dashboard/messages/useMessageComposer";
import { useMessageConversations } from "@/hooks/lawyer-dashboard/messages/useMessageConversations";
import { useMessageDeletion } from "@/hooks/lawyer-dashboard/messages/useMessageDeletion";
import { useMessageFilters } from "@/hooks/lawyer-dashboard/messages/useMessageFilters";
import { useMessageRealtime } from "@/hooks/lawyer-dashboard/messages/useMessageRealtime";
import { useMessageScroll } from "@/hooks/lawyer-dashboard/messages/useMessageScroll";
import { useMessageThreads } from "@/hooks/lawyer-dashboard/messages/useMessageThreads";
import {
  formatConversationTimestamp,
  formatMessageTimestamp,
  getInitials,
  isPublicMessageAttachmentUrl,
} from "@/lib/messages/utils";

interface UseLawyerMessagesArgs {
  userId: string | null;
  lawyerProfileId: string | null;
  activeTab: string;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export const useLawyerMessages = ({
  userId,
  lawyerProfileId,
  activeTab,
  toast,
}: UseLawyerMessagesArgs) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageRenderLimit, setMessageRenderLimit] = useState<Record<string, number>>({});
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const {
    messageConversations,
    setMessageConversations,
    messagesLoading,
    fetchMessageConversations,
  } = useMessageConversations({ userId, lawyerProfileId, toast });

  const messageFilters = useMessageFilters({ userId, messageConversations });

  const threads = useMessageThreads({
    userId,
    messageConversations,
    setMessageConversations,
    messageListRef,
    toast,
  });

  const scroll = useMessageScroll({
    messageListRef,
    activeConversationId,
    markConversationRead: threads.markConversationRead,
  });

  const composer = useMessageComposer({
    userId,
    activeConversationId,
    messageThreads: threads.messageThreads,
    setMessageThreads: threads.setMessageThreads,
    fetchMessageConversations,
    isNearBottom: scroll.isNearBottom,
    scrollToBottom: scroll.scrollToBottom,
    toast,
  });

  const clients = useMessageClients({
    userId,
    lawyerProfileId,
    messageConversations,
    setMessageConversations,
    fetchMessageConversations,
    fetchConversationMessages: threads.fetchConversationMessages,
    toast,
  });

  const deletion = useMessageDeletion({
    activeConversationId,
    setActiveConversationId,
    setMessageConversations,
    setMessageThreads: threads.setMessageThreads,
    setMessageThreadMeta: threads.setMessageThreadMeta,
    toast,
  });

  const realtime = useMessageRealtime({
    userId,
    activeConversationId,
    messageConversations,
    setMessageConversations,
    setMessageThreads: threads.setMessageThreads,
    fetchMessageConversations,
    markConversationRead: threads.markConversationRead,
    scrollToBottom: scroll.scrollToBottom,
    isNearBottom: scroll.isNearBottom,
    setShowScrollToBottom: scroll.setShowScrollToBottom,
  });

  const handleStartConversation = async () => {
    const conversationId = await clients.handleStartConversation();
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  };

  const startConversationWithClient = async (clientId: string, messageText?: string) => {
    const conversationId = await clients.startConversationForClient(clientId, messageText);
    if (conversationId) {
      clients.setShowNewChatPanel(false);
      setActiveConversationId(conversationId);
    }
    return conversationId;
  };

  const activeConversation = useMemo(
    () => messageConversations.find((conversation) => conversation.id === activeConversationId),
    [messageConversations, activeConversationId]
  );

  useEffect(() => {
    if (!activeConversationId) return;
    threads.fetchConversationMessages(activeConversationId);
    threads.markConversationRead(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    if (scroll.isNearBottom) {
      scroll.scrollToBottom(false);
    }
  }, [activeConversationId, threads.messageThreads, scroll.isNearBottom]);

  useEffect(() => {
    const checkMessageBucket = async () => {
      const exists = await composer.ensureMessageBucket();
      composer.setMessageBucketAvailable(exists);
    };
    if (activeTab === "messages") {
      checkMessageBucket();
      if (!clients.messageClientsLoading && clients.messageClients.length === 0) {
        clients.fetchMessageClients();
      }
    }
  }, [activeTab]);

  return {
    messagesTabProps: {
      activeConversationId,
      setActiveConversationId,
      activeConversation,
      messageConversations,
      filteredConversations: messageFilters.filteredConversations,
      showNewChatPanel: clients.showNewChatPanel,
      setShowNewChatPanel: clients.setShowNewChatPanel,
      fetchMessageClients: clients.fetchMessageClients,
      fetchMessageConversations,
      messageClients: clients.messageClients,
      filteredMessageClients: clients.filteredMessageClients,
      messageClientsLoading: clients.messageClientsLoading,
      newMessageFilter: clients.newMessageFilter,
      setNewMessageFilter: clients.setNewMessageFilter,
      newMessageClientId: clients.newMessageClientId,
      setNewMessageClientId: clients.setNewMessageClientId,
      newMessageText: clients.newMessageText,
      setNewMessageText: clients.setNewMessageText,
      handleStartConversation,
      newMessageSending: clients.newMessageSending,
      messageSearch: messageFilters.messageSearch,
      setMessageSearch: messageFilters.setMessageSearch,
      messageSearchLoading: messageFilters.messageSearchLoading,
      messageSearchError: messageFilters.messageSearchError,
      conversationFilter: messageFilters.conversationFilter,
      setConversationFilter: messageFilters.setConversationFilter,
      messageDateFilter: messageFilters.messageDateFilter,
      setMessageDateFilter: messageFilters.setMessageDateFilter,
      resetMessageFilters: messageFilters.resetMessageFilters,
      filtersActive: messageFilters.filtersActive,
      conversationFilterLabel: messageFilters.conversationFilterLabel,
      messageDateFilterLabel: messageFilters.messageDateFilterLabel,
      messageBucketAvailable: composer.messageBucketAvailable,
      messagesLoading,
      getInitials,
      formatConversationTimestamp,
      highlightMatch: messageFilters.highlightMatch,
      messageThreadMeta: threads.messageThreadMeta,
      fetchConversationMessages: threads.fetchConversationMessages,
      typingIndicator: realtime.typingIndicator,
      markingReadConversationId: threads.markingReadConversationId,
      messageListRef,
      messageThreads: threads.messageThreads,
      messageRenderLimit,
      setMessageRenderLimit,
      attachmentUrls: composer.attachmentUrls,
      isPublicMessageAttachmentUrl,
      formatMessageTimestamp,
      handleRetryMessage: composer.handleRetryMessage,
      showScrollToBottom: scroll.showScrollToBottom,
      scrollToBottom: scroll.scrollToBottom,
      markConversationRead: threads.markConversationRead,
      messageDraft: composer.messageDraft,
      setMessageDraft: composer.setMessageDraft,
      typingChannelRef: realtime.typingChannelRef,
      typingLastSentRef: realtime.typingLastSentRef,
      handleSendMessage: composer.handleSendMessage,
      messageSending: composer.messageSending,
      attachmentFile: composer.attachmentFile,
      setAttachmentFile: composer.setAttachmentFile,
      attachmentUploading: composer.attachmentUploading,
      setDeleteConversationId: deletion.setDeleteConversationId,
      userId,
    },
    deleteConversationDialogProps: {
      deleteConversationId: deletion.deleteConversationId,
      setDeleteConversationId: deletion.setDeleteConversationId,
      deletingConversation: deletion.deletingConversation,
      handleDeleteConversation: deletion.handleDeleteConversation,
    },
    startConversationWithClient,
  };
};

export default useLawyerMessages;
