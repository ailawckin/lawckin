import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MessageClient, MessageConversation, MessageThreadMeta } from "@/components/lawyer/dashboard/types";
import { NewChatPanel } from "./NewChatPanel";
import { MessageFilters } from "./MessageFilters";
import { ConversationList } from "./ConversationList";

interface ConversationsPanelProps {
  activeConversationId: string | null;
  showNewChatPanel: boolean;
  setShowNewChatPanel: (value: boolean) => void;
  fetchMessageClients: () => void;
  messageConversations: MessageConversation[];
  filteredConversations: MessageConversation[];
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
  highlightMatch: (text: string) => React.ReactNode;
  fetchConversationMessages: (conversationId: string, options?: { loadMore?: boolean }) => void;
  markConversationRead: (conversationId: string) => void;
  fetchMessageConversations: () => void;
  setDeleteConversationId: (value: string | null) => void;
  setActiveConversationId: (value: string | null) => void;
  userId: string | null;
}

export function ConversationsPanel({
  activeConversationId,
  showNewChatPanel,
  setShowNewChatPanel,
  fetchMessageClients,
  messageConversations,
  filteredConversations,
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
  fetchConversationMessages,
  markConversationRead,
  fetchMessageConversations,
  setDeleteConversationId,
  setActiveConversationId,
  userId,
}: ConversationsPanelProps) {
  return (
    <Card className={activeConversationId ? "hidden lg:block" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewChatPanel(!showNewChatPanel)}
          >
            {showNewChatPanel ? "Hide" : "New Chat"}
          </Button>
        </div>
        <CardDescription>{messageConversations.length} active chats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showNewChatPanel && (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <NewChatPanel
              show={showNewChatPanel}
              onToggle={() => setShowNewChatPanel(!showNewChatPanel)}
              fetchMessageClients={fetchMessageClients}
              messageClientsLoading={messageClientsLoading}
              filteredMessageClients={filteredMessageClients}
              newMessageFilter={newMessageFilter}
              setNewMessageFilter={setNewMessageFilter}
              newMessageClientId={newMessageClientId}
              setNewMessageClientId={setNewMessageClientId}
              newMessageText={newMessageText}
              setNewMessageText={setNewMessageText}
              handleStartConversation={handleStartConversation}
              newMessageSending={newMessageSending}
            />
          </div>
        )}

        <MessageFilters
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
          highlightMatch={highlightMatch}
        />

        <ConversationList
          messageConversations={messageConversations}
          filteredConversations={filteredConversations}
          activeConversationId={activeConversationId}
          messagesLoading={messagesLoading}
          messageSearch={messageSearch}
          fetchMessageClients={fetchMessageClients}
          setShowNewChatPanel={setShowNewChatPanel}
          setActiveConversationId={setActiveConversationId}
          fetchConversationMessages={fetchConversationMessages}
          markConversationRead={markConversationRead}
          fetchMessageConversations={fetchMessageConversations}
          setDeleteConversationId={setDeleteConversationId}
          formatConversationTimestamp={formatConversationTimestamp}
          getInitials={getInitials}
          highlightMatch={highlightMatch}
          userId={userId}
        />
      </CardContent>
    </Card>
  );
}
