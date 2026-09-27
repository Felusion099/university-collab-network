import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pin, MessageSquare } from 'lucide-react';
import { apiFetch } from '../../services/api/client';
import { conversationStreamUrl } from '../../services/api/live';
import { getAccessToken } from '../../services/api/session';

export interface SpaceChatUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface SpaceChatMessage {
  id: string;
  body: string;
  senderId: string;
  sender: SpaceChatUser;
  sentAt: string;
  pinnedAt: string | null;
}

interface ApiMessage {
  id: string;
  body: string;
  senderId: string;
  sender: SpaceChatUser;
  sentAt: string;
  pinnedAt?: string | null;
}

/** Renders @mentions inside a message body (WhatsApp-style highlight). */
function renderBody(body: string) {
  const parts = body.split(/(@[a-zA-Z0-9_.-]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-indigo-600 font-medium bg-indigo-50 rounded px-0.5">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

/** Reusable collaboration-space chat — messages, send, edit (own), delete
 * (own or space admin/owner), pin (space admin/owner), @mentions, SSE
 * realtime via the EXISTING conversation stream, timestamps, grouping,
 * loading/error/empty states. Used by the Project page's Chat tab and the
 * Space detail view. UCN design system throughout. */
export const SpaceChatPanel: React.FC<{
  spaceId: string;
  conversationId: string;
  me: { id: string; role: 'owner' | 'admin' | 'member' | null };
  spaceName?: string;
}> = ({ spaceId, conversationId, me, spaceName }) => {
  const [messages, setMessages] = useState<SpaceChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canModerate = me.role === 'owner' || me.role === 'admin';

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await apiFetch<{ data: ApiMessage[] }>(
        `/conversations/${conversationId}/messages?limit=100`,
      );
      setMessages(
        (res.data ?? []).map((m) => ({ ...m, pinnedAt: m.pinnedAt ?? null })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    load();
  }, [load]);

  // Realtime — the EXISTING SSE conversation stream (no new infrastructure)
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const es = new EventSource(conversationStreamUrl(conversationId, token));
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.deleted) {
          setMessages((prev) => prev.filter((m) => m.id !== data.id));
          return;
        }
        if (data.id && data.body !== undefined) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, { ...data, pinnedAt: data.pinnedAt ?? null }];
          });
        }
      } catch {
        // Ignore malformed frames — next poll/self-refresh recovers
      }
    };
    es.onerror = () => {
      // The browser auto-reconnects; nothing to do
    };
    return () => es.close();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch<ApiMessage>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: { body },
      });
      setMessages((prev) => [
        ...prev,
        { ...msg, pinnedAt: (msg as ApiMessage).pinnedAt ?? null },
      ]);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (messageId: string) => {
    const body = editingBody.trim();
    if (!body) return;
    try {
      await apiFetch(`/spaces/${spaceId}/messages/${messageId}`, {
        method: 'PATCH',
        body: { body },
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, body } : m)),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit');
    }
  };

  const remove = async (messageId: string) => {
    try {
      await apiFetch(`/spaces/${spaceId}/messages/${messageId}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const togglePin = async (messageId: string, pinned: boolean) => {
    try {
      await apiFetch(`/spaces/${spaceId}/pin`, {
        method: 'POST',
        body: { messageId, pinned },
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, pinnedAt: pinned ? new Date().toISOString() : null }
            : m,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin');
    }
  };

  const loadPinned = async () => {
    try {
      const res = await apiFetch<{ data: { id: string; body: string }[] }>(
        `/spaces/${spaceId}/pinned`,
      );
      setMessages((prev) => {
        const pinnedIds = new Set((res.data ?? []).map((p) => p.id));
        return prev.map((m) =>
          pinnedIds.has(m.id) ? { ...m, pinnedAt: m.pinnedAt ?? new Date().toISOString() } : m,
        );
      });
      setShowPinned(false);
    } catch {
      setShowPinned(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDay = (iso: string) => new Date(iso).toLocaleDateString();

  // Group messages by day + consecutive sender (WhatsApp-style grouping)
  const groups: { day: string; items: { m: SpaceChatMessage; isGroupStart: boolean }[] }[] = [];
  for (const m of messages) {
    const day = formatDay(m.sentAt);
    let g = groups[groups.length - 1];
    if (!g || g.day !== day) {
      g = { day, items: [] };
      groups.push(g);
    }
    const prev = g.items[g.items.length - 1]?.m;
    const isGroupStart =
      !prev || prev.senderId !== m.senderId || new Date(m.sentAt).getTime() - new Date(prev.sentAt).getTime() > 5 * 60 * 1000;
    g.items.push({ m, isGroupStart });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{spaceName ?? 'Chat'}</p>
          <p className="text-[11px] text-zinc-500">{messages.length} messages</p>
        </div>
        <button
          onClick={() => (showPinned ? setShowPinned(false) : loadPinned())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <Pin className="w-3.5 h-3.5" />
          Pinned
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading && <p className="text-xs text-zinc-400 text-center py-8">Loading messages…</p>}
        {!loading && error && (
          <div className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-3.5 py-2.5 text-xs">
            {error}
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-700 mt-3">No messages yet</p>
            <p className="text-xs text-zinc-500 mt-1">Start the conversation — say hello to your space.</p>
          </div>
        )}
        {groups.map((g) => (
          <div key={g.day}>
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{g.day}</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>
            {g.items.map(({ m, isGroupStart }) => {
              const mine = m.senderId === me.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[75%] ${mine ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 shrink-0">
                      {isGroupStart &&
                        (m.sender.avatarUrl ? (
                          <img src={m.sender.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-300 text-zinc-700 flex items-center justify-center text-[10px] font-bold">
                            {m.sender.username?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        ))}
                    </div>
                    <div>
                      {isGroupStart && !mine && (
                        <p className="text-[11px] font-medium text-zinc-600 mb-0.5 ml-1">{m.sender.username}</p>
                      )}
                      {editingId === m.id ? (
                        <div className="flex gap-1.5">
                          <input
                            value={editingBody}
                            onChange={(e) => setEditingBody(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(m.id)}
                            className="flex-1 px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                          />
                          <button onClick={() => saveEdit(m.id)} className="px-2.5 py-2 bg-zinc-900 text-white rounded-lg text-[11px] font-medium">
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-2.5 py-2 border border-zinc-200 rounded-lg text-[11px]">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                            mine
                              ? 'bg-zinc-900 text-white rounded-br-md'
                              : 'bg-zinc-100 text-zinc-900 rounded-bl-md'
                          } ${m.pinnedAt ? 'ring-2 ring-amber-300' : ''}`}
                        >
                          {m.pinnedAt && <Pin className="w-3 h-3 text-amber-500 inline mr-1 -mt-0.5" />}
                          {renderBody(m.body)}
                          <span className={`text-[10px] ml-2 ${mine ? 'text-zinc-400' : 'text-zinc-400'}`}>
                            {formatTime(m.sentAt)}
                          </span>
                        </div>
                      )}
                      {(mine || canModerate) && editingId !== m.id && (
                        <div className={`flex gap-2 mt-0.5 text-[10px] text-zinc-400 ${mine ? 'justify-end' : ''}`}>
                          {mine && (
                            <button
                              onClick={() => {
                                setEditingId(m.id);
                                setEditingBody(m.body);
                              }}
                              className="hover:text-zinc-600"
                            >
                              Edit
                            </button>
                          )}
                          {(mine || canModerate) && (
                            <button onClick={() => remove(m.id)} className="hover:text-red-500">
                              Delete
                            </button>
                          )}
                          {canModerate && (
                            <button
                              onClick={() => togglePin(m.id, !m.pinnedAt)}
                              className="hover:text-amber-600"
                            >
                              {m.pinnedAt ? 'Unpin' : 'Pin'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-200 px-4 py-3">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Message ${spaceName ?? 'the space'}… use @username to mention`}
            className="flex-1 px-3.5 py-2.5 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-medium disabled:opacity-40 hover:bg-zinc-800 transition-colors"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

