import { Bell } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { NotificationPanel } from "@/components/NotificationPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

/** Real /notifications page, replacing the earlier placeholder. */
export default function NotificationsPage(): JSX.Element {
  const { data: notifications, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Notifications</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-sm text-accent-700 hover:underline disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load notifications" onRetry={() => refetch()} />}

      {!isLoading && !isError && notifications && notifications.length === 0 && (
        <EmptyState icon={Bell} title="You're all caught up" />
      )}

      {!isLoading && !isError && notifications && notifications.length > 0 && (
        <NotificationPanel notifications={notifications} onMarkRead={(id) => markRead.mutate(id)} />
      )}
    </div>
  );
}
