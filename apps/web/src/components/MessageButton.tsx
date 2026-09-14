import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { messagesApi } from "@/services/api/messages";
import { ApiError } from "@/services/api/client";
import { cn } from "@/lib/utils";

/**
 * MessageButton — the ONE cross-product communication entry point.
 * Profile, search results, discover, project member cards, and research
 * team members all render this; every path converges on the same
 * open-or-create operation (POST /conversations/direct, de-duplicated
 * server-side — repeated clicks never create duplicate conversations)
 * and then navigate to /messages?c=<conversationId>, which auto-opens
 * the conversation with the composer focused.
 */
export function MessageButton({
  userId,
  username,
  className,
  label = "Message",
}: {
  userId: string;
  username?: string;
  className?: string;
  label?: string;
}): JSX.Element {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    if (opening) return;
    setOpening(true);
    setError(null);
    try {
      const conversation = await messagesApi.openOrCreateDirect({ userId });
      navigate(`/messages?c=${conversation.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? "This user doesn't accept direct messages."
          : "Couldn't open the conversation.",
      );
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        onClick={open}
        disabled={opening}
        aria-label={`Message ${username ?? "user"}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary transition-colors hover:bg-sunken disabled:opacity-50"
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
        {opening ? "Opening…" : label}
      </button>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
