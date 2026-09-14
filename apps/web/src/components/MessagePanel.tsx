import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import type { MessageItem } from "@/services/api/messages";
import { cn } from "@/lib/utils";

/**
 * MessagePanel — a conversation thread + composer. Delivery is honest:
 * the draft is only cleared after the backend accepts the message; a
 * failure preserves the draft and shows a Failed state with retry —
 * never a fake "Sent".
 */
export function MessagePanel({
  messages,
  onSend,
  sending,
  className,
}: {
  messages: MessageItem[];
  onSend: (body: string) => Promise<boolean>;
  sending?: boolean;
  className?: string;
}): JSX.Element {
  const [draft, setDraft] = useState("");
  const [failed, setFailed] = useState(false);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    const accepted = await onSend(trimmed);
    // Draft preserved on failure so the user can retry without retyping
    if (accepted) {
      setDraft("");
      setFailed(false);
    } else {
      setFailed(true);
    }
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

      {failed && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-danger-100 px-3 py-2 text-xs text-danger-600">
          <span>Message couldn't be sent.</span>
          <button
            type="button"
            onClick={() => void handleSubmit({ preventDefault: () => {} } as FormEvent)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (failed) setFailed(false);
          }}
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
