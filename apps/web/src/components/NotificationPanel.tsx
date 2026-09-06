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
  message: MessageSquare,
  project_invitation: FolderPlus,
  research_invitation: FlaskConical,
  club_announcement: Megaphone,
  event_reminder: CalendarClock,
  opportunity_deadline: Briefcase,
  publication: BookOpen,
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
  className,
}: {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("space-y-2", className)}>
      {notifications.map((n) => {
        const Icon = TYPE_ICON[n.type];
        const unread = !n.readAt;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => unread && onMarkRead(n.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              unread
                ? "border-accent-500 bg-accent-100 hover:bg-sunken"
                : "border-border bg-raised hover:bg-sunken",
            )}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm",
                  unread ? "font-medium text-text-primary" : "text-text-secondary",
                )}
              >
                {n.title}
              </p>
              <p className="text-xs text-text-muted">{formatDate(n.createdAt)}</p>
            </div>
            {unread && (
              <span
                aria-label="Unread"
                className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent-600"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
