import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MessageConversation } from "@/components/lawyer/dashboard/types";

interface ConversationHeaderProps {
  activeConversationId: string | null;
  activeConversation: MessageConversation | null;
  setActiveConversationId: (value: string | null) => void;
  setDeleteConversationId: (value: string | null) => void;
}

export function ConversationHeader({
  activeConversationId,
  activeConversation,
  setActiveConversationId,
  setDeleteConversationId,
}: ConversationHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => setActiveConversationId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>
            {activeConversationId
              ? activeConversation?.client_profile?.full_name || "Client"
              : "Message Thread"}
          </CardTitle>
        </div>
        {activeConversationId && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteConversationId(activeConversationId)}
            aria-label="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CardDescription>
        {activeConversationId
          ? activeConversation?.client_profile?.email || "Send and receive messages with your client"
          : "Select a conversation to begin"}
      </CardDescription>
    </CardHeader>
  );
}
