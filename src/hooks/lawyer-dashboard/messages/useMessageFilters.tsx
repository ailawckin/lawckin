import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLawyerStorageKey } from "@/components/lawyer/dashboard/storage";
import {
  VALID_CONVERSATION_FILTERS,
  VALID_MESSAGE_DATE_FILTERS,
} from "@/components/lawyer/dashboard/constants";
import {
  getConversationFilterLabel,
  getDateRangeStartForMessages,
  getMessageDateFilterLabel,
} from "@/lib/messages/utils";

interface UseMessageFiltersParams {
  userId: string | null;
  messageConversations: any[];
}

export function useMessageFilters({ userId, messageConversations }: UseMessageFiltersParams) {
  const [messageSearch, setMessageSearch] = useState("");
  const [conversationFilter, setConversationFilter] = useState("all");
  const [messageDateFilter, setMessageDateFilter] = useState("all");
  const [searchConversationIds, setSearchConversationIds] = useState<Set<string> | null>(null);
  const [messageSearchLoading, setMessageSearchLoading] = useState(false);
  const [messageSearchError, setMessageSearchError] = useState("");

  const highlightMatch = (text: string) => {
    if (!messageSearch.trim()) return text;
    const term = messageSearch.trim().toLowerCase();
    const lower = text.toLowerCase();
    const index = lower.indexOf(term);
    if (index === -1) return text;
    const before = text.slice(0, index);
    const match = text.slice(index, index + term.length);
    const after = text.slice(index + term.length);
    return (
      <span>
        {before}
        <span className="bg-yellow-200 text-foreground">{match}</span>
        {after}
      </span>
    );
  };

  const resetMessageFilters = () => {
    setConversationFilter("all");
    setMessageDateFilter("all");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getLawyerStorageKey(userId, "conversationFilter"), "all");
      window.localStorage.setItem(getLawyerStorageKey(userId, "messageDateFilter"), "all");
    }
  };

  const filtersActive = conversationFilter !== "all" || messageDateFilter !== "all";
  const conversationFilterLabel = getConversationFilterLabel(conversationFilter);
  const messageDateFilterLabel = getMessageDateFilterLabel(messageDateFilter);

  const filteredConversations = useMemo(() => {
    let items = [...messageConversations];
    const rangeStart = getDateRangeStartForMessages(messageDateFilter);
    if (rangeStart) {
      items = items.filter((conv) => {
        const timestamp = conv.last_message_at || conv.updated_at;
        return new Date(timestamp) >= rangeStart;
      });
    }
    if (conversationFilter === "unread") {
      items = items.filter((conv) => (conv.unread_count || 0) > 0);
    }
    if (messageSearch.trim()) {
      const term = messageSearch.toLowerCase();
      items = items.filter((conv) => {
        const matchesSearchSet = searchConversationIds?.has(conv.id);
        const name = conv.client_profile?.full_name?.toLowerCase() || "";
        const preview = conv.last_message_preview?.toLowerCase() || "";
        return matchesSearchSet || name.includes(term) || preview.includes(term);
      });
    } else if (searchConversationIds) {
      items = items.filter((conv) => searchConversationIds.has(conv.id));
    }
    return items;
  }, [
    messageConversations,
    conversationFilter,
    messageSearch,
    searchConversationIds,
    messageDateFilter,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedConversation = window.localStorage.getItem(
      getLawyerStorageKey(userId, "conversationFilter")
    );
    if (storedConversation && VALID_CONVERSATION_FILTERS.includes(storedConversation as any)) {
      setConversationFilter(storedConversation);
    }
    const storedMessageDate = window.localStorage.getItem(
      getLawyerStorageKey(userId, "messageDateFilter")
    );
    if (storedMessageDate && VALID_MESSAGE_DATE_FILTERS.includes(storedMessageDate as any)) {
      setMessageDateFilter(storedMessageDate);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      getLawyerStorageKey(userId, "conversationFilter"),
      conversationFilter
    );
  }, [conversationFilter, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      getLawyerStorageKey(userId, "messageDateFilter"),
      messageDateFilter
    );
  }, [messageDateFilter, userId]);

  useEffect(() => {
    setMessageSearchError("");
    if (!messageSearch.trim()) {
      setSearchConversationIds(null);
      setMessageSearchLoading(false);
      return;
    }
    if (messageSearch.trim().length < 2 || messageConversations.length === 0) {
      setSearchConversationIds(null);
      setMessageSearchLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setMessageSearchLoading(true);
      try {
        const conversationIds = messageConversations.map((conv) => conv.id);
        let query = supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", conversationIds)
          .ilike("content", `%${messageSearch.trim()}%`);
        const rangeStart = getDateRangeStartForMessages(messageDateFilter);
        if (rangeStart) {
          query = query.gte("created_at", rangeStart.toISOString());
        }
        const { data, error } = await query;
        if (error) throw error;
        const ids = new Set((data || []).map((item) => item.conversation_id));
        setSearchConversationIds(ids);
      } catch {
        setMessageSearchError("Search failed. Try again.");
      } finally {
        setMessageSearchLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [messageSearch, messageConversations, messageDateFilter]);

  return {
    messageSearch,
    setMessageSearch,
    conversationFilter,
    setConversationFilter,
    messageDateFilter,
    setMessageDateFilter,
    messageSearchLoading,
    messageSearchError,
    filtersActive,
    conversationFilterLabel,
    messageDateFilterLabel,
    filteredConversations,
    highlightMatch,
    resetMessageFilters,
  };
}
