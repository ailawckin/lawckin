import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseMessageConversationsParams {
  userId: string | null;
  lawyerProfileId: string | null;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useMessageConversations({ userId, lawyerProfileId, toast }: UseMessageConversationsParams) {
  const [messageConversations, setMessageConversations] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchMessageConversations = async () => {
    if (!lawyerProfileId || !userId) return;
    setMessagesLoading(true);
    try {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("id, client_id, lawyer_id, updated_at, created_at")
        .eq("lawyer_id", lawyerProfileId)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const clientIds = (conversations || []).map((conv: any) => conv.client_id);
      let clientProfiles: Record<string, any> = {};
      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, email")
          .in("user_id", clientIds);

        clientProfiles = (profiles || []).reduce((acc: Record<string, any>, profile: any) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {});
      }

      let unreadMessages: any[] = [];
      if (conversations && conversations.length > 0) {
        const { data } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", (conversations || []).map((conv: any) => conv.id))
          .neq("sender_id", userId)
          .neq("status", "read");
        unreadMessages = data || [];
      }

      const unreadMap = (unreadMessages || []).reduce((acc: Record<string, number>, msg: any) => {
        acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1;
        return acc;
      }, {});

      let latestMessageMap: Record<string, any> = {};
      if (conversations && conversations.length > 0) {
        const { data } = await supabase
          .from("messages")
          .select("conversation_id, created_at, content, sender_id")
          .in("conversation_id", (conversations || []).map((conv: any) => conv.id))
          .order("created_at", { ascending: false });
        latestMessageMap = (data || []).reduce((acc: Record<string, any>, msg: any) => {
          if (!acc[msg.conversation_id]) {
            acc[msg.conversation_id] = msg;
          }
          return acc;
        }, {});
      }

      const enhanced = (conversations || [])
        .map((conv: any) => {
          const latest = latestMessageMap[conv.id];
          return {
            ...conv,
            last_message_at: latest?.created_at || conv.updated_at,
            last_message_preview: latest?.content || "",
            last_message_sender_id: latest?.sender_id || null,
            client_profile: clientProfiles[conv.client_id],
            unread_count: unreadMap[conv.id] || 0,
          };
        })
        .sort((a: any, b: any) => {
          const aTime = a.last_message_at || a.updated_at;
          const bTime = b.last_message_at || b.updated_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

      setMessageConversations(enhanced);
    } catch (error: any) {
      toast({
        title: "Failed to load messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || !lawyerProfileId) return;
    fetchMessageConversations();
  }, [userId, lawyerProfileId]);

  return {
    messageConversations,
    setMessageConversations,
    messagesLoading,
    fetchMessageConversations,
  };
}
