import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { messagesApi, type MessageItem } from "@/services/api/messages";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations(),
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.listMessages(conversationId!),
    enabled: Boolean(conversationId),
  });
}

/**
 * Realtime message delivery — SSE stream per conversation (GET
 * /conversations/:id/stream, participant-only server-side). New messages
 * appear without refresh; the query cache stays the source of truth.
 */
export function useMessageStream(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!conversationId) return;
    const source = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/conversations/${conversationId}/stream`,
      { withCredentials: true },
    );
    source.onmessage = (event) => {
      const message = JSON.parse(event.data) as MessageItem;
      queryClient.setQueryData<MessageItem[]>(["messages", conversationId], (prev) =>
        prev?.some((m) => m.id === message.id) ? prev : [...(prev ?? []), message],
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
    return () => source.close();
  }, [conversationId, queryClient]);
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
