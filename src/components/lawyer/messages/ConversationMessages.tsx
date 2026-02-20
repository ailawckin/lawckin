import { format, isToday, isYesterday } from "date-fns";
import { Check, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MessageItem, MessageThreadMeta } from "@/components/lawyer/dashboard/types";

interface ConversationMessagesProps {
  activeConversationId: string | null;
  messageThreads: Record<string, MessageItem[]>;
  messageThreadMeta: Record<string, MessageThreadMeta>;
  fetchConversationMessages: (conversationId: string, options?: { loadMore?: boolean }) => void;
  markingReadConversationId: string | null;
  typingIndicator: Record<string, boolean>;
  messageListRef: React.RefObject<HTMLDivElement>;
  messageRenderLimit: Record<string, number>;
  setMessageRenderLimit: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  attachmentUrls: Record<string, string>;
  isPublicMessageAttachmentUrl: (url?: string | null) => boolean;
  formatMessageTimestamp: (value?: string | null) => string;
  handleRetryMessage: (message: MessageItem) => void;
  userId: string | null;
}

export function ConversationMessages({
  activeConversationId,
  messageThreads,
  messageThreadMeta,
  fetchConversationMessages,
  markingReadConversationId,
  typingIndicator,
  messageListRef,
  messageRenderLimit,
  setMessageRenderLimit,
  attachmentUrls,
  isPublicMessageAttachmentUrl,
  formatMessageTimestamp,
  handleRetryMessage,
  userId,
}: ConversationMessagesProps) {
  if (!activeConversationId) {
    return <div className="py-8 text-center text-muted-foreground">Choose a conversation to view messages.</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {(messageThreadMeta[activeConversationId]?.hasMore ||
          messageThreadMeta[activeConversationId]?.loading) ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchConversationMessages(activeConversationId, { loadMore: true })}
            disabled={
              !messageThreadMeta[activeConversationId]?.hasMore ||
              messageThreadMeta[activeConversationId]?.loading
            }
          >
            {messageThreadMeta[activeConversationId]?.loading
              ? "Loading..."
              : "Load earlier messages"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {markingReadConversationId === activeConversationId && <span>Marking as read...</span>}
          {typingIndicator[activeConversationId] && <span>Client is typing...</span>}
        </div>
      </div>
      <div
        ref={messageListRef}
        className="h-[420px] overflow-y-auto space-y-3 rounded-lg border bg-muted/20 p-4 sm:h-[520px] lg:h-[600px]"
      >
        {(messageThreads[activeConversationId] || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet</p>
        ) : (
          (() => {
            const thread = messageThreads[activeConversationId] || [];
            const limit = messageRenderLimit[activeConversationId] || 200;
            const renderSlice = thread.length > limit ? thread.slice(-limit) : thread;
            let lastDateLabel = "";
            return renderSlice.map((message) => {
              const messageDate = format(new Date(message.created_at), "yyyy-MM-dd");
              const showSeparator = messageDate !== lastDateLabel;
              lastDateLabel = messageDate;
              const label = isToday(new Date(message.created_at))
                ? "Today"
                : isYesterday(new Date(message.created_at))
                  ? "Yesterday"
                  : format(new Date(message.created_at), "MMM d, yyyy");
              const attachmentHref =
                attachmentUrls[message.id] ||
                (isPublicMessageAttachmentUrl(message.attachment_url)
                  ? message.attachment_url
                  : undefined);
              return (
                <div key={message.id} className="space-y-2">
                  {showSeparator && (
                    <div className="text-center text-xs text-muted-foreground">{label}</div>
                  )}
                  <div
                    className={`flex ${
                      message.sender_id === userId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[80%] space-y-1">
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          message.sender_id === userId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content || (message.attachment_url ? "Attachment" : "")}
                        {message.attachment_url && attachmentHref && (
                          <a
                            href={attachmentHref}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 flex items-center gap-2 text-xs underline"
                          >
                            <Paperclip className="h-3 w-3" />
                            {message.attachment_name || "Attachment"}
                          </a>
                        )}
                        {message.attachment_url && !attachmentHref && (
                          <p className="mt-2 text-xs text-muted-foreground">Attachment unavailable</p>
                        )}
                        {message.attachment_size && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {(message.attachment_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatMessageTimestamp(message.created_at)}</span>
                        {message.sender_id === userId && (
                          <>
                            {message.local_status === "pending" && (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> Sending
                              </span>
                            )}
                            {message.local_status === "failed" && (
                              <span className="flex items-center gap-1 text-destructive">
                                Failed
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-auto px-1 text-destructive"
                                  onClick={() => handleRetryMessage(message)}
                                >
                                  Retry
                                </Button>
                              </span>
                            )}
                            {!message.local_status && (
                              <span className="flex items-center gap-1">
                                {message.status === "read" ? (
                                  <>
                                    <Check className="h-3 w-3 text-primary" />
                                    {message.read_at
                                      ? `Read ${formatMessageTimestamp(message.read_at)}`
                                      : "Read"}
                                  </>
                                ) : message.status === "delivered" ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    Delivered
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3" />
                                    Sent
                                  </>
                                )}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
      {(messageThreads[activeConversationId] || []).length >
        (messageRenderLimit[activeConversationId] || 200) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setMessageRenderLimit((prev) => ({
              ...prev,
              [activeConversationId]: (messageThreads[activeConversationId] || []).length,
            }))
          }
        >
          Show all loaded messages
        </Button>
      )}
    </>
  );
}
