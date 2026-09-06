/**
 * PROVISIONAL mock for notifications — DATABASE_SCHEMA.md's
 * `notifications` table (`type`, `payload` jsonb, `read_at`). Not
 * documented as a REST resource in API_CONTRACT.md at all (unlike
 * projects/events/etc., which follow §3's generic convention) — this is
 * a real gap, but a smaller one than HANDOFF-22 (a single endpoint
 * shape, not a whole missing schema category), so noted here rather than
 * filed as a full HANDOFF entry. `type` values mirror spec §22's
 * documented notification-type list.
 */
export type NotificationType =
  | "connection_request"
  | "message"
  | "project_invitation"
  | "research_invitation"
  | "club_announcement"
  | "event_reminder"
  | "opportunity_deadline"
  | "publication"
  | "team_recruitment"
  | "profile_interaction";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  createdAt: string; // ISO date
  readAt: string | null;
}

const notifications: NotificationItem[] = [
  {
    id: "n-1",
    type: "connection_request",
    title: "Arjun Mehta wants to connect",
    createdAt: "2026-09-04",
    readAt: null,
  },
  {
    id: "n-2",
    type: "message",
    title: "New message from Dr. Radhika Iyer",
    createdAt: "2026-09-03",
    readAt: null,
  },
  {
    id: "n-3",
    type: "event_reminder",
    title: 'Reminder: "Guest Talk: Distributed Systems at Scale" is in 2 days',
    createdAt: "2026-09-02",
    readAt: "2026-09-02",
  },
  {
    id: "n-4",
    type: "team_recruitment",
    title: "Iyer NLP Lab is looking for new members",
    createdAt: "2026-08-30",
    readAt: "2026-08-31",
  },
];

export const notificationsApi = {
  list: async (): Promise<NotificationItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  markAsRead: async (id: string): Promise<NotificationItem | null> => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const item = notifications.find((n) => n.id === id);
    if (!item) return null;
    item.readAt = new Date().toISOString().slice(0, 10);
    return item;
  },

  markAllAsRead: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const today = new Date().toISOString().slice(0, 10);
    notifications.forEach((n) => {
      if (!n.readAt) n.readAt = today;
    });
  },
};
