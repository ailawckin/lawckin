import type { ReactNode } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MessageConversation } from "@/components/lawyer/dashboard/types";

interface ConversationListProps {
  messageConversations: MessageConversation[];
  filteredConversations: MessageConversation[];
  activeConversationId: string | null;
  messagesLoading: boolean;
  messageSearch: string;
  fetchMessageClients: () => void;
  setShowNewChatPanel: (value: boolean) => void;
  setActiveConversationId: (value: string | null) => void;
  fetchConversationMessages: (conversationId: string, options?: { loadMore?: boolean }) => void;
  markConversationRead: (conversationId: string) => void;
  fetchMessageConversations: () => void;
  setDeleteConversationId: (value: string | null) => void;
  formatConversationTimestamp: (value?: string | null) => string;
  getInitials: (value?: string | null) => string;
  highlightMatch: (text: string) => ReactNode;
  userId: string | null;
}

export function ConversationList({
  messageConversations,
  filteredConversations,
  activeConversationId,
  messagesLoading,
  messageSearch,
  fetchMessageClients,
  setShowNewChatPanel,
  setActiveConversationId,
  fetchConversationMessages,
  markConversationRead,
  fetchMessageConversations,
  setDeleteConversationId,
  formatConversationTimestamp,
  getInitials,
  highlightMatch,
  userId,
}: ConversationListProps) {
  if (messagesLoading) {
    return <p className="text-sm text-muted-foreground">Loading conversations...</p>;
  }

  if (messageConversations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          No conversations yet. Messages from clients will appear here.
        </p>
        <Button
          size="sm"
          onClick={() => {
            fetchMessageClients();
            setShowNewChatPanel(true);
          }}
        >
          Start a Conversation
        </Button>
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return <p className="text-sm text-muted-foreground">No results found.</p>;
  }

  return (
    <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
      {filteredConversations.map((conversation) => {
        const clientName = conversation.client_profile?.full_name || "Client";
        return (
          <button
            key={conversation.id}
            title={conversation.client_profile?.email || undefined}
            onClick={async () => {
              setActiveConversationId(conversation.id);
              await fetchConversationMessages(conversation.id);
              await markConversationRead(conversation.id);
              await fetchMessageConversations();
            }}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              activeConversationId === conversation.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/40"
            }`}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={conversation.client_profile?.avatar_url || ""}
                alt={clientName}
              />
              <AvatarFallback>{getInitials(conversation.client_profile?.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {conversation.client_profile?.email || "No email"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {formatConversationTimestamp(
                      conversation.last_message_at || conversation.updated_at
                    )}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteConversationId(conversation.id);
                    }}
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-muted-foreground">
                  {conversation.last_message_preview ? (
                    <>
                      {conversation.last_message_sender_id === userId ? "You: " : ""}
                      {highlightMatch(conversation.last_message_preview)}
                    </>
                  ) : (
                    "No messages yet"
                  )}
                </p>
                {conversation.unread_count && conversation.unread_count > 0 && (
                  <Badge variant="destructive">{conversation.unread_count}</Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
