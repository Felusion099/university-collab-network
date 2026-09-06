import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import type { MessageItem } from "@/services/api/messages";
import { cn } from "@/lib/utils";

/**
 * MessagePanel — ARCHITECTURE.md §5. A single conversation's thread +
 * composer. Real messaging is very likely WebSocket/polling-based per
 * ARCHITECTURE.md, not plain request/response — this mock only covers
 * the request/response shape (list + send), same limitation noted in
 * services/api/messages.ts.
 */
export function MessagePanel({
  messages,
  onSend,
  sending,
  className,
}: {
  messages: MessageItem[];
  onSend: (body: string) => void;
  sending?: boolean;
  className?: string;
}): JSX.Element {
  const [draft, setDraft] = useState("");

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex-1 space-y-3 overflow-y-auto p-1">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.isMe ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                m.isMe
                  ? "bg-accent-600 text-text-onAccent"
                  : "border border-border bg-raised text-text-primary",
              )}
            >
              {!m.isMe && <p className="mb-0.5 text-xs font-medium opacity-80">{m.senderName}</p>}
              {m.body}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message..."
          aria-label="Message"
          className="flex-1 rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Send"
          className="flex items-center justify-center rounded-md bg-accent-600 px-3 text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
