import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MessageClient } from "@/components/lawyer/dashboard/types";

interface NewChatPanelProps {
  show: boolean;
  onToggle: () => void;
  fetchMessageClients: () => void;
  messageClientsLoading: boolean;
  filteredMessageClients: MessageClient[];
  newMessageFilter: string;
  setNewMessageFilter: (value: string) => void;
  newMessageClientId: string;
  setNewMessageClientId: (value: string) => void;
  newMessageText: string;
  setNewMessageText: (value: string) => void;
  handleStartConversation: () => void;
  newMessageSending: boolean;
}

export function NewChatPanel({
  show,
  onToggle,
  fetchMessageClients,
  messageClientsLoading,
  filteredMessageClients,
  newMessageFilter,
  setNewMessageFilter,
  newMessageClientId,
  setNewMessageClientId,
  newMessageText,
  setNewMessageText,
  handleStartConversation,
  newMessageSending,
}: NewChatPanelProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Start new chat</p>
          <p className="text-xs text-muted-foreground">
            Message any client who booked a consultation.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchMessageClients}>
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        <Select value={newMessageFilter} onValueChange={setNewMessageFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            <SelectItem value="upcoming">Upcoming consultations</SelectItem>
            <SelectItem value="past">Past consultations</SelectItem>
          </SelectContent>
        </Select>

        {messageClientsLoading ? (
          <p className="text-xs text-muted-foreground">Loading clients...</p>
        ) : filteredMessageClients.length === 0 ? (
          <p className="text-xs text-muted-foreground">No clients available yet.</p>
        ) : (
          <Select value={newMessageClientId} onValueChange={setNewMessageClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {filteredMessageClients.map((client) => (
                <SelectItem key={client.client_id} value={client.client_id}>
                  {client.profile?.full_name || client.profile?.email || "Client"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Textarea
        value={newMessageText}
        onChange={(event) => setNewMessageText(event.target.value)}
        placeholder="Write a message (optional)"
        rows={3}
      />
      <Button
        onClick={handleStartConversation}
        disabled={!newMessageClientId || newMessageSending}
        className="w-full"
      >
        {newMessageSending ? "Sending..." : "Start Chat"}
      </Button>
    </>
  );
}
