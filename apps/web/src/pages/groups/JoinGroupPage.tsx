import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users2, LogIn } from "lucide-react";
import { groupsApi } from "@/services/api/groups";
import { useSessionStore } from "@/stores/session.store";
import { ApiError } from "@/services/api/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { relativeTime } from "@/lib/utils";

/**
 * JoinGroupPage (/groups/join/:token) — the invite-link landing page.
 * Opening the link NEVER auto-adds the user: it shows the invitation
 * context (group, creator, member count, expiry) and requires an explicit
 * Join. All states handled: expired / revoked / invalid / already-member /
 * not-authenticated (preserves the invite target through login).
 */
export default function JoinGroupPage(): JSX.Element {
  const { token } = useParams<{ token: string }>();
  const status = useSessionStore((s) => s.status);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewState = useInvitePreview(token, status === "authenticated");

  const join = useMutation({
    mutationFn: () => groupsApi.acceptInviteLink(token!),
    onSuccess: () => {
      setJoined(true);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["my-join-requests"] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Couldn't join the group."),
  });

  if (status !== "authenticated") {
    // Preserve the invitation target: after login the user returns here
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-lg border border-border bg-raised p-6 text-center">
          <Users2 className="mx-auto h-8 w-8 text-accent-600" aria-hidden="true" />
          <h1 className="mt-2 text-xl font-semibold text-text-primary">You're invited</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Log in to see the group invitation and join.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/login?next=/groups/join/${token}`)}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700"
          >
            <LogIn className="h-4 w-4" />
            Log in to join
          </button>
          <Link
            to="/signup"
            className="mt-2 inline-block text-xs text-accent-600 hover:text-accent-700"
          >
            or create an account
          </Link>
        </div>
      </div>
    );
  }

  if (previewState.isLoading) {
    return <Skeleton className="mx-auto h-48 w-full max-w-md rounded-lg" />;
  }

  if (joined) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-lg border border-success-600/30 bg-success-100/40 p-6 text-center">
          <Users2 className="mx-auto h-8 w-8 text-success-600" aria-hidden="true" />
          <h1 className="mt-2 text-xl font-semibold text-text-primary">You're in!</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {previewState.data
              ? `You joined ${previewState.data.groupName}. The group is now in Messages → Groups.`
              : "The group is now in Messages → Groups."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="mt-4 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700"
          >
            Open Messages
          </button>
        </div>
      </div>
    );
  }

  if (previewState.error || !previewState.data) {
    // Expired / revoked / invalid — a useful explanation, never a 404
    const message =
      (previewState.error instanceof ApiError && previewState.error.message) ||
      "This invitation link is not valid.";
    const isExpired = message.toLowerCase().includes("expired");
    const isRevoked = message.toLowerCase().includes("no longer active");
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-lg border border-border bg-raised p-6 text-center">
          <Users2 className="mx-auto h-8 w-8 text-text-muted" aria-hidden="true" />
          <h1 className="mt-2 text-xl font-semibold text-text-primary">
            {isExpired ? "Invitation expired" : isRevoked ? "Invitation revoked" : "Invitation unavailable"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isExpired || isRevoked
              ? "Ask the group owner for a new invitation."
              : "This invitation link is not valid."}
          </p>
          <Link
            to="/messages"
            className="mt-4 inline-block rounded-md border border-border px-4 py-2 text-sm text-text-primary hover:bg-sunken"
          >
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  const p = previewState.data;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-lg border border-border bg-raised p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-text-secondary">
            {p.groupName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-text-primary">You're invited to join</h1>
            <p className="mt-1 font-medium text-text-primary">{p.groupName}</p>
            {p.description && (
              <p className="mt-0.5 text-sm text-text-secondary">{p.description}</p>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-text-muted">
          <p>
            Created by <span className="font-medium text-text-secondary">@{p.creatorUsername}</span>
          </p>
          <p>
            {p.memberCount} member{p.memberCount === 1 ? "" : "s"} · Expires in{" "}
            {relativeTime(p.expiresAt)}
          </p>
        </div>
        {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}
        <button
          type="button"
          onClick={() => join.mutate()}
          disabled={join.isPending}
          className="mt-4 w-full rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
        >
          {join.isPending ? "Joining…" : "Join Group"}
        </button>
      </div>
    </div>
  );
}

function useInvitePreview(token: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["invite-preview", token],
    queryFn: () => groupsApi.getInvitePreview(token!),
    enabled: Boolean(token) && enabled,
    retry: false,
  });
}
