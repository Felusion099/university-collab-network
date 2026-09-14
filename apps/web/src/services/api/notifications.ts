import { apiFetch } from "./client";

export type NotificationType =
  | "connection_request"
  | "new_message"
  | "project_invitation"
  | "research_invitation"
  | "club_announcement"
  | "event_reminder"
  | "opportunity_deadline"
  | "new_publication"
  | "team_recruitment"
  | "profile_interaction";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  /** Structured payload for actionable notifications (requestId, projectId,
   * projectName, kind...) — the existing Notification.payload jsonb. */
  payload: Record<string, unknown>;
  createdAt: string; // ISO timestamp
  readAt: string | null;
}

const str = (p: Record<string, unknown>, k: string): string =>
  typeof p[k] === "string" ? (p[k] as string) : "";

/**
 * Titles built from the REAL notification payload (same mapping the
 * dashboard activity uses) — one real domain event, one notification,
 * titled from its actual data.
 */
function titleFor(type: NotificationType, p: Record<string, unknown>): string {
  switch (type) {
    case "connection_request":
      return str(p, "requesterName")
        ? `Connection request from ${str(p, "requesterName")}`
        : "New connection request";
    case "new_message":
      return str(p, "senderName")
        ? `New message from ${str(p, "senderName")}`
        : "New message received";
    case "project_invitation":
      return str(p, "projectName")
        ? `You were invited to join ${str(p, "projectName")}`
        : "New project invitation";
    case "research_invitation":
      return str(p, "teamName")
        ? `You were invited to join ${str(p, "teamName")}`
        : "New research invitation";
    case "team_recruitment": {
      const kind = str(p, "kind");
      const name = str(p, "projectName") || str(p, "teamName");
      if (kind === "project_join_request" || kind === "team_join_request") {
        const who = str(p, "requesterName") || "Someone";
        return name ? `${who} requested to join ${name}` : `${who} requested to join your project`;
      }
      if (kind === "project_request_accepted" || kind === "team_request_accepted") {
        return name ? `Your request to join ${name} was accepted` : "Your join request was accepted";
      }
      if (kind === "project_invitation_accepted" || kind === "team_invitation_accepted") {
        return name ? `A new member joined ${name}` : "A new member joined your project";
      }
      return "Team recruitment update";
    }
    case "profile_interaction": {
      const kind = str(p, "kind");
      if (kind === "verification_approved") return "Your verification request was approved";
      if (kind === "project_request_rejected" || kind === "team_request_rejected")
        return "Your join request was not accepted";
      if (kind === "project_invitation_rejected" || kind === "team_invitation_rejected")
        return "Your invitation was declined";
      return "Profile update";
    }
    case "new_publication":
      return `New publication: ${str(p, "title") || "added"}`;
    case "club_announcement":
      return str(p, "title") || "Club announcement";
    case "event_reminder":
      return str(p, "title") || "Event reminder";
    case "opportunity_deadline":
      return str(p, "title") || "Opportunity deadline approaching";
    default:
      return "Platform update";
  }
}

export const notificationsApi = {
  list: async (unreadOnly = false): Promise<NotificationItem[]> => {
    const raw = await apiFetch<{
      data?: {
        id: string;
        type: string;
        payload: Record<string, unknown>;
        readAt: string | null;
        createdAt: string;
      }[];
    }>(`/notifications?limit=30${unreadOnly ? "&unreadOnly=true" : ""}`);
    return (raw.data ?? []).map((n) => ({
      id: n.id,
      type: n.type as NotificationType,
      title: titleFor(n.type as NotificationType, n.payload ?? {}),
      payload: n.payload ?? {},
      createdAt: n.createdAt,
      readAt: n.readAt,
    }));
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
  },

  markAllAsRead: async (): Promise<void> => {
    await apiFetch("/notifications/read-all", { method: "PATCH" });
  },
};
