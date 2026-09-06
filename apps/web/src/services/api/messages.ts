/**
 * PROVISIONAL mock for messaging — DATABASE_SCHEMA.md's
 * `conversations`/`messages` tables. Not documented as a REST resource in
 * API_CONTRACT.md (real messaging is very likely WebSocket/polling-based,
 * per ARCHITECTURE.md's mention of REST/polling for messages — not a
 * simple CRUD list this mock can fully represent). `sendMessage` only
 * appends to the in-memory array — no real persistence, same
 * mocked-but-functional pattern as admin.ts's mutations.
 */
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

const conversations: ConversationSummary[] = [
  {
    id: "c-1",
    title: "Dr. Radhika Iyer",
    lastMessagePreview: "Sounds good — let's discuss at the lab meeting.",
    lastMessageAt: "2026-09-04",
    unread: true,
  },
  {
    id: "c-2",
    title: "Peer Code Review Bot (project)",
    lastMessagePreview: "Pushed the reviewer-matching logic, PTAL",
    lastMessageAt: "2026-09-02",
    unread: false,
  },
  {
    id: "c-3",
    title: "Robotics Club",
    lastMessagePreview: "Demo day is confirmed for Oct 5th!",
    lastMessageAt: "2026-08-30",
    unread: false,
  },
];

const messagesByConversation: Record<string, MessageItem[]> = {
  "c-1": [
    {
      id: "m-1",
      conversationId: "c-1",
      senderName: "Dr. Radhika Iyer",
      isMe: false,
      body: "Hi! I saw your interest in the NLP lab — do you have time to chat this week?",
      sentAt: "2026-09-03",
    },
    {
      id: "m-2",
      conversationId: "c-1",
      senderName: "You",
      isMe: true,
      body: "Yes, I'm free Thursday afternoon.",
      sentAt: "2026-09-03",
    },
    {
      id: "m-3",
      conversationId: "c-1",
      senderName: "Dr. Radhika Iyer",
      isMe: false,
      body: "Sounds good — let's discuss at the lab meeting.",
      sentAt: "2026-09-04",
    },
  ],
  "c-2": [
    {
      id: "m-4",
      conversationId: "c-2",
      senderName: "Sanjana Desai",
      isMe: false,
      body: "Pushed the reviewer-matching logic, PTAL",
      sentAt: "2026-09-02",
    },
  ],
  "c-3": [
    {
      id: "m-5",
      conversationId: "c-3",
      senderName: "Club Admin",
      isMe: false,
      body: "Demo day is confirmed for Oct 5th!",
      sentAt: "2026-08-30",
    },
  ],
};

export const messagesApi = {
  listConversations: async (): Promise<ConversationSummary[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  },

  listMessages: async (conversationId: string): Promise<MessageItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return messagesByConversation[conversationId] ?? [];
  },

  sendMessage: async (conversationId: string, body: string): Promise<MessageItem> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const message: MessageItem = {
      id: crypto.randomUUID(),
      conversationId,
      senderName: "You",
      isMe: true,
      body,
      sentAt: new Date().toISOString().slice(0, 10),
    };
    messagesByConversation[conversationId] = [
      ...(messagesByConversation[conversationId] ?? []),
      message,
    ];
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      conversation.lastMessagePreview = body;
      conversation.lastMessageAt = message.sentAt;
    }
    return message;
  },
};
