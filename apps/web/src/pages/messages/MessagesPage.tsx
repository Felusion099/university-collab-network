import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { MessageSquare, Plus, X } from "lucide-react";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMessageStream,
  useConversationById,
} from "@/hooks/useMessages";
import { messagesApi, setCurrentUserId } from "@/services/api/messages";
import { groupsApi } from "@/services/api/groups";
import { useSessionStore } from "@/stores/session.store";
import { ApiError } from "@/services/api/client";
import { MessagePanel } from "@/components/MessagePanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { relativeTime, cn } from "@/lib/utils";

type Tab = "direct" | "groups" | "project";

/**
 * Messages — the communication hub. Three contexts share ONE messaging
 * architecture: Direct (user↔user), Groups (personal group conversations),
 * and Project/Team (workspace chats). ?c=<id> deep-opens any conversation.
 * The composer is never hidden; failures surface the actual reason.
 */
export default function MessagesPage(): JSX.Element {
  const { data: conversations, isLoading, isError, refetch } = useConversations();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | undefined>(
    searchParams.get("c") ?? undefined,
  );
  const [tab, setTab] = useState<Tab>("direct");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { user } = useSessionStore();
  const {
    data: messages,
    isLoading: messagesLoading,
    isError: messagesError,
    refetch: refetchMessages,
  } = useMessages(selectedId);
  const sendMessage = useSendMessage(selectedId);
  const connected = useMessageStream(selectedId);
  const [sendError, setSendError] = useState<string | null>(null);

  // The backend derives isMe from senderId vs the session user
  useEffect(() => {
    setCurrentUserId(user?.id ?? null);
  }, [user?.id]);

  const activeId = selectedId ?? conversations?.[0]?.id;
  const activeConversation = conversations?.find((c) => c.id === activeId);
  const shouldFetchById = Boolean(activeId) && !activeConversation;
  const { data: fetchedConversation } = useConversationById(
    shouldFetchById ? activeId : undefined,
  );
  const headerConversation = activeConversation ?? fetchedConversation ?? null;

  const filtered = (conversations ?? []).filter((c) => {
    if (tab === "direct") return c.type === "direct";
    if (tab === "groups") return c.type === "group";
    return c.type === "project" || c.type === "research_team" || c.type === "club";
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text-primary">Messages</h1>
          {!connected && activeId && (
            <span className="flex items-center gap-1.5 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-medium text-warning-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning-600" />
              Reconnecting…
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsCreateGroupOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary transition-colors hover:bg-sunken"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Group
          </button>
          <NewMessageButton onCreated={(id) => setSelectedId(id)} refetch={refetch} />
        </div>
      </div>

      {/* Tabs — what kind of conversation is this? */}
      <div className="flex gap-1 rounded-lg border border-border bg-raised p-1 sm:w-fit">
        {(
          [
            ["direct", "Direct"],
            ["groups", "Groups"],
            ["project", "Project / Team"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tab === key
                ? "bg-accent-100 text-accent-700"
                : "text-text-secondary hover:bg-sunken hover:text-text-primary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load conversations" onRetry={() => refetch()} />}

      {!isLoading && !isError && !activeId && filtered.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title={tab === "direct" ? "No conversations yet" : "Nothing here yet"}
          description={
            tab === "direct"
              ? "Message someone from their profile, or use New message above."
              : tab === "groups"
                ? "Create a group above, or wait for an invitation."
                : "Project and team chats appear here once you join a project or team."
          }
        />
      )}

      {!isLoading && !isError && activeId && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:h-[28rem]">
          <div className="space-y-1 overflow-y-auto md:col-span-1">
            {filtered.length === 0 && (
              <p className="px-1 py-2 text-xs text-text-muted">
                {tab === "groups"
                  ? "Your groups are updating… or create one above."
                  : "Your conversation list is updating…"}
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedId(c.id);
                  setSendError(null);
                  setSearchParams({ c: c.id }, { replace: true });
                }}
                className={cn(
                  "block w-full rounded-lg border p-3 text-left transition-colors",
                  c.id === activeId
                    ? "border-accent-500 bg-accent-100"
                    : "border-border bg-raised hover:bg-sunken",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      c.unread ? "font-semibold text-text-primary" : "font-medium text-text-primary",
                    )}
                  >
                    {c.title}
                  </p>
                  <span className="flex flex-shrink-0 items-center gap-1.5">
                    {c.unread && <span className="h-2 w-2 rounded-full bg-accent-500" aria-label="Unread" />}
                    <span className="text-xs text-text-muted">{relativeTime(c.lastMessageAtFull)}</span>
                  </span>
                </div>
                <p className="truncate text-xs text-text-secondary">{c.lastMessagePreview}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-col rounded-lg border border-border bg-raised md:col-span-2 md:h-[34rem]">
            {/* CONVERSATION HEADER — who/what am I talking to */}
            {headerConversation && (
              <div className="flex items-center justify-between gap-3 border-b border-border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-text-secondary">
                    {headerConversation.title.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {headerConversation.title}
                    </p>
                    {headerConversation.type === "group" ? (
                      <p className="text-xs text-text-muted">Group</p>
                    ) : (
                      headerConversation.otherParticipant && (
                        <p className="truncate text-xs capitalize text-text-muted">
                          {headerConversation.otherParticipant.role.replace("_", " ")}
                        </p>
                      )
                    )}
                  </div>
                </div>
                {headerConversation.type === "direct" &&
                  headerConversation.otherParticipant && (
                    <Link
                      to={`/students/${headerConversation.otherParticipant.username}`}
                      className="flex-shrink-0 text-xs text-accent-600 hover:text-accent-700"
                    >
                      View Profile
                    </Link>
                  )}
              </div>
            )}
            <div className="min-h-0 flex-1 p-3">
            {sendError && (
              <div className="mb-2 rounded-md bg-danger-100 px-3 py-2 text-sm text-danger-600">
                {sendError}
              </div>
            )}
            {messagesLoading && <Skeleton className="h-full w-full" />}
            {!messagesLoading && messagesError && (
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <p className="text-sm text-danger-600">Couldn't load messages.</p>
                <button
                  type="button"
                  onClick={() => refetchMessages()}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
                >
                  Retry
                </button>
              </div>
            )}
            {/* THE COMPOSER MUST NEVER BE HIDDEN — it renders even if the
                history failed to load (messages ?? []), so the user can
                always send. */}
            {!messagesLoading && (
              <MessagePanel
                messages={messages ?? []}
                onSend={async (body) => {
                  try {
                    await sendMessage.mutateAsync(body);
                    return true;
                  } catch (err) {
                    setSendError(
                      err instanceof ApiError
                        ? err.status === 401
                          ? "Your session expired — please log in again."
                          : err.message
                        : "Message couldn't be sent.",
                    );
                    return false;
                  }
                }}
                sending={sendMessage.isPending}
                className="h-full"
              />
            )}
            </div>
          </div>
        </div>
      )}

      {isCreateGroupOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateGroupOpen(false)}
          onCreated={(id) => {
            setIsCreateGroupOpen(false);
            setSelectedId(id);
            setSearchParams({ c: id }, { replace: true });
            setTab("groups");
            refetch();
          }}
        />
      )}
    </div>
  );
}

/**
 * CreateGroupModal — name/description → creates the group (owner + linked
 * conversation) and OPENS IT IMMEDIATELY (never a confirmation page).
 */
function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (groupId: string) => void;
}): JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const group = await groupsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onCreated(group.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the group.");
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-raised p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Create Group</h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && <div className="mb-3 rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Group name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) void create();
              }}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="e.g., Computer Vision Discussion"
              disabled={creating}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="What is this group for?"
              disabled={creating}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="rounded-md border border-border px-4 py-2 text-sm text-text-primary hover:bg-sunken disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={create}
              disabled={creating || !name.trim()}
              className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create & Open"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * NewMessageButton — username → user id → open-or-create direct
 * conversation (de-duplicated server-side) → opens immediately.
 */
function NewMessageButton({
  onCreated,
  refetch,
}: {
  onCreated: (id: string) => void;
  refetch: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const userId = await messagesApi.resolveUserId(username.trim());
      const conv = await messagesApi.openOrCreateDirect({ userId });
      refetch();
      onCreated(conv.id);
      setOpen(false);
      setUsername("");
      setTabDirect();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : `No user found with username "${username.trim()}"`,
      );
      setCreating(false);
    }
  };

  const setTabDirect = () => {
    // direct tab is default; nothing to do here (kept for clarity)
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-text-onAccent hover:bg-accent-700"
      >
        <Plus className="h-3.5 w-3.5" />
        New message
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-raised p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-primary">New message</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && <div className="mb-3 rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && username.trim()) void create();
              }}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Username to message — e.g., priya.sharma"
              disabled={creating}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm text-text-primary hover:bg-sunken"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={create}
                disabled={creating || !username.trim()}
                className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
              >
                {creating ? "Starting…" : "Start conversation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
