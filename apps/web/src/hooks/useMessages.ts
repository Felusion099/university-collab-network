import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { messagesApi, type MessageItem } from "@/services/api/messages";
import { useSessionStore } from "@/stores/session.store";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations(),
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const messages = await messagesApi.listMessages(conversationId!);
      // Opening the conversation marks it read (database-authoritative)
      await messagesApi.markRead(conversationId!);
      return messages;
    },
    enabled: Boolean(conversationId),
    refetchOnWindowFocus: true,
  });
}

/**
 * Realtime message delivery — SSE stream per conversation (GET
 * /conversations/:id/stream, participant-only server-side). New messages
 * appear without refresh; the query cache stays the source of truth.
 */
export function useMessageStream(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    const accessToken = useSessionStore.getState().accessToken;
    if (!accessToken) return;

    // EventSource cannot send Authorization headers — the token travels
    // via ?token= and is validated server-side with the same verification
    // requireAuth uses. Sender identity is never trusted from the client.
    const source = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/conversations/${conversationId}/stream?token=${encodeURIComponent(accessToken)}`,
    );

    source.onopen = () => {
      setConnected(true);
      // Reconnected — refetch to catch anything missed while offline
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
    source.onmessage = (event) => {
      const message = JSON.parse(event.data) as MessageItem;
      queryClient.setQueryData<MessageItem[]>(["messages", conversationId], (prev) =>
        prev?.some((m) => m.id === message.id) ? prev : [...(prev ?? []), message],
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
    // EventSource auto-reconnects natively; surface the state
    source.onerror = () => setConnected(false);

    return () => {
      source.close();
      setConnected(false);
    };
  }, [conversationId, queryClient]);

  return connected;
}

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messagesApi.sendMessage(conversationId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useConversationById(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => messagesApi.getById(conversationId!),
    enabled: Boolean(conversationId),
  });
}
