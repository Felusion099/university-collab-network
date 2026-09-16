import {
  UserPlus,
  MessageSquare,
  FolderPlus,
  FlaskConical,
  Megaphone,
  CalendarClock,
  Briefcase,
  BookOpen,
  Users2,
  Eye,
} from "lucide-react";
import type { NotificationItem, NotificationType } from "@/services/api/notifications";
import { formatDate, cn } from "@/lib/utils";

const TYPE_ICON: Record<NotificationType, typeof UserPlus> = {
  connection_request: UserPlus,
  new_message: MessageSquare,
  project_invitation: FolderPlus,
  research_invitation: FlaskConical,
  club_announcement: Megaphone,
  event_reminder: CalendarClock,
  opportunity_deadline: Briefcase,
  new_publication: BookOpen,
  team_recruitment: Users2,
  profile_interaction: Eye,
};

/**
 * NotificationPanel — ARCHITECTURE.md §5. Icon-per-type mapping mirrors
 * `notification_preferences`' 10 boolean columns (DATABASE_SCHEMA.md) —
 * same 10 categories a user can toggle in Settings (see PrivacyControls's
 * neighbor, the notification-preferences form on /settings).
 */
export function NotificationPanel({
  notifications,
  onMarkRead,
  onAction,
  className,
}: {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  /** Actionable notifications: join requests -> Review; invitations ->
   * Accept/Decline — wired to the real request endpoints by the caller. */
  onAction?: (notification: NotificationItem, action: "accept" | "decline" | "review") => void;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("space-y-2", className)}>
      {notifications.map((n) => {
        const Icon = TYPE_ICON[n.type];
        const unread = !n.readAt;
        const kind = typeof n.payload.kind === "string" ? n.payload.kind : "";
        const requestId = typeof n.payload.requestId === "string" ? n.payload.requestId : "";
        const isJoinRequest = kind === "project_join_request" || kind === "team_join_request";
        const isInvitation =
          kind === "group_invitation" ||
          kind === "project_invitation" ||
          (n.type === "project_invitation" && requestId && !isJoinRequest) ||
          kind === "research_team_invitation";
        return (
          <div
            key={n.id}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              unread
                ? "border-accent-500 bg-accent-100"
                : "border-border bg-raised",
            )}
          >
            <button
              type="button"
              onClick={() => unread && onMarkRead(n.id)}
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm",
                    unread ? "font-medium text-text-primary" : "text-text-secondary",
                  )}
                >
                  {n.title}
                </span>
                <span className="block text-xs text-text-muted">{formatDate(n.createdAt)}</span>
              </span>
            </button>
            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
              {unread && <span aria-label="Unread" className="h-2 w-2 rounded-full bg-accent-600" />}
              {unread && isJoinRequest && requestId && onAction && (
                <button
                  type="button"
                  onClick={() => onAction(n, "review")}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-sunken"
                >
                  Review
                </button>
              )}
              {unread && isInvitation && requestId && onAction && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAction(n, "accept")}
                    className="rounded-md bg-accent-600 px-2.5 py-1 text-xs font-medium text-text-onAccent hover:bg-accent-700"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction(n, "decline")}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-sunken"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
