import { apiFetch } from "./client";

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessagePreview: string;
  lastMessageAt: string; // ISO date
  unread: boolean; // derived from real lastReadAt vs last message
  lastMessageAtFull: string; // ISO timestamp (for unread comparison)
  /** The other participant (direct conversations) — drives the
   * conversation header (avatar, name, View Profile). */
  otherParticipant: {
    userId: string;
    username: string;
    role: string;
  } | null;
  /** Conversation context — drives the Messages tabs (Direct / Groups /
   * Project·Team) and the conversation header. */
  type: "direct" | "group" | "project" | "research_team" | "club" | "other";
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderName: string;
  isMe: boolean;
  body: string;
  sentAt: string; // ISO date
}

/**
 * Real conversation/message API — GET /conversations (participant-only,
 * server-authorized), GET/POST /conversations/:id/messages. The backend
 * row (nested participants w/ user, last message) is mapped to the flat
 * display shape: the conversation TITLE is the other participant's
 * username (never a raw UUID), `isMe` derived from senderId vs the
 * session user.
 */
let currentUserId: string | null = null;
export function setCurrentUserId(id: string | null) {
  currentUserId = id;
}

interface RawConversation {
  id: string;
  type: string;
  updatedAt: string;
  participants?: { userId: string; lastReadAt?: string | null; user: { id: string; username: string; avatarUrl?: string | null; requestedRole?: string } }[];
  messages?: { id: string; body: string; sentAt: string }[];
}

interface RawMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: string;
  sender?: { id: string; username: string };
}

export const messagesApi = {
  listConversations: async (): Promise<ConversationSummary[]> => {
    const raw = await apiFetch<{
      data?: (RawConversation & {
        participants2?: { lastReadAt?: string | null }[];
      })[];
    }>("/conversations?limit=50");
    return (raw.data ?? []).map((c) => {
      const other = (c.participants ?? []).find((p) => p.userId !== currentUserId);
      const mine = (c.participants ?? []).find((p) => p.userId === currentUserId);
      const last = (c.messages ?? [])[0];
      const lastSentAt = last?.sentAt ?? c.updatedAt;
      const convType = (c.type as RawConversation["type"]) ?? "other";
      // Real unread: last message is newer than my lastReadAt, and it
      // wasn't sent by me.
      const unread =
        currentUserId !== null &&
        Boolean(last) &&
        (last as { senderId?: string }).senderId !== currentUserId &&
        (!mine?.lastReadAt || new Date(lastSentAt) > new Date(mine.lastReadAt));
      return {
        id: c.id,
        title: other?.user.username ?? "Conversation",
        lastMessagePreview: last?.body ?? "",
        lastMessageAt: lastSentAt.slice(0, 10),
        lastMessageAtFull: lastSentAt,
        unread,
        otherParticipant: other
          ? {
              userId: other.userId,
              username: other.user.username,
              role: other.user.requestedRole ?? "member",
            }
          : null,
        type: convType as ConversationSummary["type"],
      };
    });
  },

  markRead: async (conversationId: string): Promise<void> => {
    await apiFetch(`/conversations/${conversationId}/read`, { method: "POST" });
  },

  listMessages: async (conversationId: string): Promise<MessageItem[]> => {
    const raw = await apiFetch<{ data?: RawMessage[] }>(
      `/conversations/${conversationId}/messages?limit=50`,
    );
    // Backend orders sentAt desc — display asc
    const ordered = [...(raw.data ?? [])].reverse();
    return ordered.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderName: m.sender?.username ?? "Unknown",
      isMe: currentUserId !== null ? m.senderId === currentUserId : false,
      body: m.body,
      sentAt: m.sentAt,
    }));
  },

  sendMessage: async (conversationId: string, body: string): Promise<MessageItem> => {
    const raw = await apiFetch<RawMessage>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      // The schema expects { body: string } — passing the raw string
      // produced a bare JSON document that body-parser's strict mode
      // rejected (500). THE one-line root cause of 'Message couldn't be
      // sent.'
      body: { body },
    });
    return {
      id: raw.id,
      conversationId: raw.conversationId,
      senderName: "Me",
      isMe: true,
      body: raw.body,
      sentAt: raw.sentAt,
    };
  },

  createConversation: async (input: {
    type: "direct" | "group" | "project" | "research_team";
    participantIds: string[];
  }): Promise<RawConversation> => {
    return apiFetch<RawConversation>("/conversations", { method: "POST", body: input });
  },

  getById: async (conversationId: string): Promise<ConversationSummary | null> => {
    try {
      const c = await apiFetch<RawConversation & {
        participants?: {
          userId: string;
          lastReadAt?: string | null;
          user: { id: string; username: string; avatarUrl?: string | null; requestedRole?: string };
        }[];
      }>(`/conversations/${conversationId}`);
      const other = (c.participants ?? []).find((p) => p.userId !== currentUserId);
      return {
        id: c.id,
        type: ((c.type as RawConversation["type"]) ?? "other") as ConversationSummary["type"],
        title: other?.user.username ?? "Conversation",
        lastMessagePreview: "",
        lastMessageAt: c.updatedAt.slice(0, 10),
        lastMessageAtFull: c.updatedAt,
        unread: false,
        otherParticipant: other
          ? {
              userId: other.userId,
              username: other.user.username,
              role: other.user.requestedRole ?? "member",
            }
          : null,
      };
    } catch {
      return null;
    }
  },

  openOrCreateDirect: async (input: { userId: string }): Promise<{ id: string }> => {
    return apiFetch<{ id: string }>("/conversations/direct", {
      method: "POST",
      body: input,
    });
  },

  resolveUserId: async (username: string): Promise<string> => {
    const user = await apiFetch<{ id: string }>(`/users/${username}`);
    return user.id;
  },
};
