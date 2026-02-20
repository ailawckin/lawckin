import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type MessageStatus = "sent" | "delivered" | "read" | string;

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  created_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  lawyer_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  lawyer_profiles?: {
    user_id: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setConversations([]);
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          lawyer_profiles!conversations_lawyer_id_fkey(
            user_id,
            profiles!lawyer_profiles_user_id_fkey(full_name, avatar_url)
          )
        `)
        .eq("client_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations((data as Conversation[]) || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Unable to load conversations",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages((prev) => ({
        ...prev,
        [conversationId]: (data as Message[]) || [],
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        });

        if (error) throw error;

        await fetchMessages(conversationId);
      } catch (error: any) {
        toast({
          title: "Error sending message",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [fetchMessages, toast]
  );

  const createConversation = useCallback(
    async (lawyerId: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("conversations")
          .insert({
            client_id: user.id,
            lawyer_id: lawyerId,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            const { data: existing } = await supabase
              .from("conversations")
              .select("*")
              .eq("client_id", user.id)
              .eq("lawyer_id", lawyerId)
              .single();

            return existing;
          }
          throw error;
        }

        return data;
      } catch (error: any) {
        toast({
          title: "Error creating conversation",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast]
  );

  useEffect(() => {
    void fetchConversations();

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          void fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    createConversation,
  };
};
