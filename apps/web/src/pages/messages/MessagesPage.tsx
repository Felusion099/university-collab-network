import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useMessages";
import { MessagePanel } from "@/components/MessagePanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, cn } from "@/lib/utils";

/** Real /messages page, replacing the earlier placeholder. */
export default function MessagesPage(): JSX.Element {
  const { data: conversations, isLoading, isError, refetch } = useConversations();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedId);
  const sendMessage = useSendMessage(selectedId);

  const activeId = selectedId ?? conversations?.[0]?.id;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Messages</h1>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load conversations" onRetry={() => refetch()} />}

      {!isLoading && !isError && conversations && conversations.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Messages with your connections and project teams will show up here."
        />
      )}

      {!isLoading && !isError && conversations && conversations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:h-[28rem]">
          <div className="space-y-1 overflow-y-auto md:col-span-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "block w-full rounded-lg border p-3 text-left transition-colors",
                  c.id === activeId
                    ? "border-accent-500 bg-accent-100"
                    : "border-border bg-raised hover:bg-sunken",
                )}
              >
                <p className="truncate text-sm font-medium text-text-primary">{c.title}</p>
                <p className="truncate text-xs text-text-secondary">{c.lastMessagePreview}</p>
                <p className="mt-0.5 text-xs text-text-muted">{formatDate(c.lastMessageAt)}</p>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-raised p-3 md:col-span-2">
            {messagesLoading && <Skeleton className="h-full w-full" />}
            {!messagesLoading && messages && (
              <MessagePanel
                messages={messages}
                onSend={(body) => sendMessage.mutate(body)}
                sending={sendMessage.isPending}
                className="h-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
