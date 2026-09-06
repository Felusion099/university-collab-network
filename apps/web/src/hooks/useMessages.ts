import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/services/api/messages";

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
