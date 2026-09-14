import { apiFetch } from "./client";

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessagePreview: string;
  lastMessageAt: string; // ISO date
  unread: boolean;
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
  participants?: { userId: string; user: { id: string; username: string; avatarUrl?: string | null } }[];
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
    const raw = await apiFetch<{ data?: RawConversation[] }>("/conversations?limit=50");
    return (raw.data ?? []).map((c) => {
      const other = (c.participants ?? []).find((p) => p.userId !== currentUserId);
      const last = (c.messages ?? [])[0];
      return {
        id: c.id,
        title: other?.user.username ?? "Conversation",
        lastMessagePreview: last?.body ?? "",
        lastMessageAt: (last?.sentAt ?? c.updatedAt).slice(0, 10),
        unread: false,
      };
    });
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
      body,
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

  resolveUserId: async (username: string): Promise<string> => {
    const user = await apiFetch<{ id: string }>(`/users/${username}`);
    return user.id;
  },
};
