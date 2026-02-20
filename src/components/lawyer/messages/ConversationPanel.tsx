import type { MutableRefObject } from "react";
import type { MessageConversation, MessageItem, MessageThreadMeta } from "@/components/lawyer/dashboard/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationMessages } from "./ConversationMessages";
import { MessageComposer } from "./MessageComposer";

interface TypingChannel {
  send: (payload: { type: string; event: string; payload: { sender_id?: string | null } }) => void;
}

interface ConversationPanelProps {
  activeConversationId: string | null;
  activeConversation: MessageConversation | null;
  setActiveConversationId: (value: string | null) => void;
  setDeleteConversationId: (value: string | null) => void;
  messageThreadMeta: Record<string, MessageThreadMeta>;
  fetchConversationMessages: (conversationId: string, options?: { loadMore?: boolean }) => void;
  markingReadConversationId: string | null;
  typingIndicator: Record<string, boolean>;
  messageListRef: React.RefObject<HTMLDivElement>;
  messageThreads: Record<string, MessageItem[]>;
  messageRenderLimit: Record<string, number>;
  setMessageRenderLimit: React.Dispatch<React.SetStateAction<Record<string, number>>>;
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
  userId: string | null;
}

export function ConversationPanel({
  activeConversationId,
  activeConversation,
  setActiveConversationId,
  setDeleteConversationId,
  messageThreadMeta,
  fetchConversationMessages,
  markingReadConversationId,
  typingIndicator,
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
  userId,
}: ConversationPanelProps) {
  return (
    <Card className={activeConversationId ? "" : "hidden lg:block"}>
      <ConversationHeader
        activeConversationId={activeConversationId}
        activeConversation={activeConversation}
        setActiveConversationId={setActiveConversationId}
        setDeleteConversationId={setDeleteConversationId}
      />
      <CardContent className="space-y-4">
        <ConversationMessages
          activeConversationId={activeConversationId}
          messageThreads={messageThreads}
          messageThreadMeta={messageThreadMeta}
          fetchConversationMessages={fetchConversationMessages}
          markingReadConversationId={markingReadConversationId}
          typingIndicator={typingIndicator}
          messageListRef={messageListRef}
          messageRenderLimit={messageRenderLimit}
          setMessageRenderLimit={setMessageRenderLimit}
          attachmentUrls={attachmentUrls}
          isPublicMessageAttachmentUrl={isPublicMessageAttachmentUrl}
          formatMessageTimestamp={formatMessageTimestamp}
          handleRetryMessage={handleRetryMessage}
          userId={userId}
        />
        {showScrollToBottom && activeConversationId && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                scrollToBottom();
                if (activeConversationId) {
                  markConversationRead(activeConversationId);
                }
              }}
            >
              New messages
            </Button>
          </div>
        )}
        <MessageComposer
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
      </CardContent>
    </Card>
  );
}
