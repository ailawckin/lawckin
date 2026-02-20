import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseMessageClientsParams {
  userId: string | null;
  lawyerProfileId: string | null;
  messageConversations: any[];
  setMessageConversations: Dispatch<SetStateAction<any[]>>;
  fetchMessageConversations: () => Promise<void>;
  fetchConversationMessages: (conversationId: string) => Promise<void>;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useMessageClients({
  userId,
  lawyerProfileId,
  messageConversations,
  setMessageConversations,
  fetchMessageConversations,
  fetchConversationMessages,
  toast,
}: UseMessageClientsParams) {
  const [messageClients, setMessageClients] = useState<any[]>([]);
  const [messageClientsLoading, setMessageClientsLoading] = useState(false);
  const [newMessageClientId, setNewMessageClientId] = useState("");
  const [newMessageFilter, setNewMessageFilter] = useState("all");
  const [newMessageText, setNewMessageText] = useState("");
  const [newMessageSending, setNewMessageSending] = useState(false);
  const [showNewChatPanel, setShowNewChatPanel] = useState(true);

  const fetchMessageClients = async () => {
    if (!lawyerProfileId) return;
    setMessageClientsLoading(true);
    try {
      const { data: consults, error } = await supabase
        .from("consultations")
        .select("client_id, scheduled_at, status")
        .eq("lawyer_id", lawyerProfileId);

      if (error) throw error;

      const uniqueClientIds = Array.from(
        new Set([...(consults || []).map((consult: any) => consult.client_id)])
      );
      if (uniqueClientIds.length === 0) {
        setMessageClients([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, email")
        .in("user_id", uniqueClientIds);

      const profileMap = (profiles || []).reduce((acc: Record<string, any>, profile: any) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {});

      const now = new Date();
      const enhancedClients = uniqueClientIds.map((clientId) => {
        const clientConsults = (consults || []).filter((c: any) => c.client_id === clientId);
        const hasUpcoming = clientConsults.some(
          (c: any) => new Date(c.scheduled_at) > now && c.status !== "cancelled"
        );
        const hasPast = clientConsults.some(
          (c: any) => new Date(c.scheduled_at) <= now || c.status === "completed"
        );
        return {
          client_id: clientId,
          profile: profileMap[clientId],
          hasUpcoming,
          hasPast,
        };
      });

      setMessageClients(enhancedClients);
    } catch (error: any) {
      toast({
        title: "Failed to load clients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMessageClientsLoading(false);
    }
  };

  const startConversation = async (clientId: string, messageText: string) => {
    if (!lawyerProfileId || !clientId || !userId) return null;
    setNewMessageSending(true);
    try {
      const existing = messageConversations.find(
        (conversation) => conversation.client_id === clientId
      );
      let conversationId = existing?.id;
      let clientProfile = messageClients.find(
        (client) => client.client_id === clientId
      )?.profile;

      if (!clientProfile) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, email")
          .eq("user_id", clientId)
          .maybeSingle();
        clientProfile = data || null;
      }

      if (!conversationId) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            client_id: clientId,
            lawyer_id: lawyerProfileId,
          })
          .select()
          .single();
        if (error) {
          if (error.code === "23505") {
            const { data: existingConv } = await supabase
              .from("conversations")
              .select("id")
              .eq("client_id", clientId)
              .eq("lawyer_id", lawyerProfileId)
              .single();
            conversationId = existingConv?.id;
          } else {
            throw error;
          }
        } else {
          conversationId = data?.id;
        }
      }

      if (!conversationId) throw new Error("Unable to start conversation.");

      if (!existing) {
        setMessageConversations((prev) => [
          {
            id: conversationId,
            client_id: clientId,
            lawyer_id: lawyerProfileId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            last_message_preview: messageText.trim() || "No messages yet",
            last_message_sender_id: userId,
            client_profile: clientProfile,
            unread_count: 0,
          },
          ...prev,
        ]);
      }

      if (messageText.trim()) {
        const { error: messageError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content: messageText.trim(),
          });
        if (messageError) throw messageError;
      }

      await fetchMessageConversations();
      await fetchConversationMessages(conversationId);
      return conversationId;
    } catch (error: any) {
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setNewMessageSending(false);
    }
  };

  const handleStartConversation = async () => {
    const conversationId = await startConversation(newMessageClientId, newMessageText);
    if (conversationId) {
      setNewMessageClientId("");
      setNewMessageText("");
    }
    return conversationId;
  };

  const startConversationForClient = async (clientId: string, messageText = "") =>
    startConversation(clientId, messageText);

  const filteredMessageClients = useMemo(() => {
    if (newMessageFilter === "upcoming") {
      return messageClients.filter((client) => client.hasUpcoming);
    }
    if (newMessageFilter === "past") {
      return messageClients.filter((client) => client.hasPast);
    }
    return messageClients;
  }, [messageClients, newMessageFilter]);

  return {
    messageClients,
    messageClientsLoading,
    fetchMessageClients,
    newMessageClientId,
    setNewMessageClientId,
    newMessageFilter,
    setNewMessageFilter,
    newMessageText,
    setNewMessageText,
    newMessageSending,
    handleStartConversation,
    startConversationForClient,
    filteredMessageClients,
    showNewChatPanel,
    setShowNewChatPanel,
  };
}
