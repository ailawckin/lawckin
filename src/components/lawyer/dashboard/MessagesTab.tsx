import type { Dispatch, MutableRefObject, ReactNode, RefObject, SetStateAction } from "react";
import { TabsContent } from "@/components/ui/tabs";
import type {
  MessageClient,
  MessageConversation,
  MessageItem,
  MessageThreadMeta,
} from "@/components/lawyer/dashboard/types";
import { ConversationPanel } from "@/components/lawyer/messages/ConversationPanel";
import { ConversationsPanel } from "@/components/lawyer/messages/ConversationsPanel";

interface TypingChannel {
  send: (payload: { type: string; event: string; payload: { sender_id?: string | null } }) => void;
}

interface MessagesTabProps {
  activeConversationId: string | null;
  setActiveConversationId: (value: string | null) => void;
  activeConversation: MessageConversation | null;
  messageConversations: MessageConversation[];
  filteredConversations: MessageConversation[];
  showNewChatPanel: boolean;
  setShowNewChatPanel: (value: boolean) => void;
  fetchMessageClients: () => void;
  fetchMessageConversations: () => void;
  messageClients: MessageClient[];
  filteredMessageClients: MessageClient[];
  messageClientsLoading: boolean;
  newMessageFilter: string;
  setNewMessageFilter: (value: string) => void;
  newMessageClientId: string;
  setNewMessageClientId: (value: string) => void;
  newMessageText: string;
  setNewMessageText: (value: string) => void;
  handleStartConversation: () => void;
  newMessageSending: boolean;
  messageSearch: string;
  setMessageSearch: (value: string) => void;
  messageSearchLoading: boolean;
  messageSearchError: string;
  conversationFilter: string;
  setConversationFilter: (value: string) => void;
  messageDateFilter: string;
  setMessageDateFilter: (value: string) => void;
  resetMessageFilters: () => void;
  filtersActive: boolean;
  conversationFilterLabel: string;
  messageDateFilterLabel: string;
  messageBucketAvailable: boolean;
  messagesLoading: boolean;
  getInitials: (value?: string | null) => string;
  formatConversationTimestamp: (value?: string | null) => string;
  highlightMatch: (text: string) => ReactNode;
  messageThreadMeta: Record<string, MessageThreadMeta>;
  fetchConversationMessages: (conversationId: string, options?: { loadMore?: boolean }) => void;
  typingIndicator: Record<string, boolean>;
  markingReadConversationId: string | null;
  messageListRef: RefObject<HTMLDivElement>;
  messageThreads: Record<string, MessageItem[]>;
  messageRenderLimit: Record<string, number>;
  setMessageRenderLimit: Dispatch<SetStateAction<Record<string, number>>>;
  attachmentUrls: Record<string, string>;
  isPublicMessageAttachmentUrl: (url?: string | null) => boolean;
  formatMessageTimestamp: (value?: string | null) => string;
  handleRetryMessage: (message: MessageItem) => void;
  showScrollToBottom: boolean;
  scrollToBottom: () => void;
  markConversationRead: (conversationId: string) => void;
  messageDraft: string;
  setMessageDraft: (value: string) => void;
  typingChannelRef: MutableRefObject<TypingChannel | null>;
  typingLastSentRef: MutableRefObject<number>;
  handleSendMessage: () => void;
  messageSending: boolean;
  attachmentFile: File | null;
  setAttachmentFile: (file: File | null) => void;
  attachmentUploading: boolean;
  setDeleteConversationId: (value: string | null) => void;
  userId: string | null;
}

const MessagesTab = ({
  activeConversationId,
  setActiveConversationId,
  activeConversation,
  messageConversations,
  filteredConversations,
  showNewChatPanel,
  setShowNewChatPanel,
  fetchMessageClients,
  fetchMessageConversations,
  messageClients,
  filteredMessageClients,
  messageClientsLoading,
  newMessageFilter,
  setNewMessageFilter,
  newMessageClientId,
  setNewMessageClientId,
  newMessageText,
  setNewMessageText,
  handleStartConversation,
  newMessageSending,
  messageSearch,
  setMessageSearch,
  messageSearchLoading,
  messageSearchError,
  conversationFilter,
  setConversationFilter,
  messageDateFilter,
  setMessageDateFilter,
  resetMessageFilters,
  filtersActive,
  conversationFilterLabel,
  messageDateFilterLabel,
  messageBucketAvailable,
  messagesLoading,
  getInitials,
  formatConversationTimestamp,
  highlightMatch,
  messageThreadMeta,
  fetchConversationMessages,
  typingIndicator,
  markingReadConversationId,
  messageListRef,
  messageThreads,
  messageRenderLimit,
  setMessageRenderLimit,
  attachmentUrls,
  isPublicMessageAttachmentUrl,
  formatMessageTimestamp,
  handleRetryMessage,
  showScrollToBottom,
  scrollToBottom,
  markConversationRead,
  messageDraft,
  setMessageDraft,
  typingChannelRef,
  typingLastSentRef,
  handleSendMessage,
  messageSending,
  attachmentFile,
  setAttachmentFile,
  attachmentUploading,
  setDeleteConversationId,
  userId,
}: MessagesTabProps) => {
  return (
    <TabsContent value="messages" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ConversationsPanel
          activeConversationId={activeConversationId}
          showNewChatPanel={showNewChatPanel}
          setShowNewChatPanel={setShowNewChatPanel}
          fetchMessageClients={fetchMessageClients}
          messageConversations={messageConversations}
          filteredConversations={filteredConversations}
          messageClients={messageClients}
          filteredMessageClients={filteredMessageClients}
          messageClientsLoading={messageClientsLoading}
          newMessageFilter={newMessageFilter}
          setNewMessageFilter={setNewMessageFilter}
          newMessageClientId={newMessageClientId}
          setNewMessageClientId={setNewMessageClientId}
          newMessageText={newMessageText}
          setNewMessageText={setNewMessageText}
          handleStartConversation={handleStartConversation}
          newMessageSending={newMessageSending}
          messageSearch={messageSearch}
          setMessageSearch={setMessageSearch}
          messageSearchLoading={messageSearchLoading}
          messageSearchError={messageSearchError}
          conversationFilter={conversationFilter}
          setConversationFilter={setConversationFilter}
          messageDateFilter={messageDateFilter}
          setMessageDateFilter={setMessageDateFilter}
          resetMessageFilters={resetMessageFilters}
          filtersActive={filtersActive}
          conversationFilterLabel={conversationFilterLabel}
          messageDateFilterLabel={messageDateFilterLabel}
          messageBucketAvailable={messageBucketAvailable}
          messagesLoading={messagesLoading}
          getInitials={getInitials}
          formatConversationTimestamp={formatConversationTimestamp}
          highlightMatch={highlightMatch}
          fetchConversationMessages={fetchConversationMessages}
          markConversationRead={markConversationRead}
          fetchMessageConversations={fetchMessageConversations}
          setDeleteConversationId={setDeleteConversationId}
          setActiveConversationId={setActiveConversationId}
          userId={userId}
        />

        <ConversationPanel
          activeConversationId={activeConversationId}
          activeConversation={activeConversation}
          setActiveConversationId={setActiveConversationId}
          setDeleteConversationId={setDeleteConversationId}
          messageThreadMeta={messageThreadMeta}
          fetchConversationMessages={fetchConversationMessages}
          markingReadConversationId={markingReadConversationId}
          typingIndicator={typingIndicator}
          messageListRef={messageListRef}
          messageThreads={messageThreads}
          messageRenderLimit={messageRenderLimit}
          setMessageRenderLimit={setMessageRenderLimit}
          attachmentUrls={attachmentUrls}
          isPublicMessageAttachmentUrl={isPublicMessageAttachmentUrl}
          formatMessageTimestamp={formatMessageTimestamp}
          handleRetryMessage={handleRetryMessage}
          showScrollToBottom={showScrollToBottom}
          scrollToBottom={scrollToBottom}
          markConversationRead={markConversationRead}
          messageDraft={messageDraft}
          setMessageDraft={setMessageDraft}
          typingChannelRef={typingChannelRef}
          typingLastSentRef={typingLastSentRef}
          handleSendMessage={handleSendMessage}
          messageSending={messageSending}
          attachmentFile={attachmentFile}
          setAttachmentFile={setAttachmentFile}
          attachmentUploading={attachmentUploading}
          userId={userId}
        />
      </div>
    </TabsContent>
  );
};

export default MessagesTab;
