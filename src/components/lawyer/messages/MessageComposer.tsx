import type { MutableRefObject } from "react";
import { Loader2, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TypingChannel {
  send: (payload: { type: string; event: string; payload: { sender_id?: string | null } }) => void;
}

interface MessageComposerProps {
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

export function MessageComposer({
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
}: MessageComposerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Type a message"
          rows={1}
          className="min-h-[44px] max-h-[140px] resize-none"
          value={messageDraft}
          onChange={(event) => {
            setMessageDraft(event.target.value);
            if (typingChannelRef.current) {
              const now = Date.now();
              if (now - typingLastSentRef.current > 800) {
                typingLastSentRef.current = now;
                typingChannelRef.current.send({
                  type: "broadcast",
                  event: "typing",
                  payload: { sender_id: userId },
                });
              }
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <label className="flex cursor-pointer items-center justify-center rounded-md border px-3 py-2">
          <Paperclip className="h-4 w-4" />
          <input
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setAttachmentFile(file);
            }}
          />
        </label>
        <Button
          onClick={handleSendMessage}
          disabled={messageSending || attachmentUploading || (!messageDraft.trim() && !attachmentFile)}
        >
          {messageSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {attachmentFile && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
          <Paperclip className="h-3 w-3" />
          <span className="truncate">{attachmentFile.name}</span>
          <Button size="sm" variant="ghost" className="h-auto px-1" onClick={() => setAttachmentFile(null)}>
            Remove
          </Button>
        </div>
      )}
      {attachmentUploading && (
        <p className="text-xs text-muted-foreground">Uploading attachment...</p>
      )}
    </div>
  );
}
