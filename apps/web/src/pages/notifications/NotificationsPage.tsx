import { Bell } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { NotificationPanel } from "@/components/NotificationPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/services/api/client";
import { groupsApi } from "@/services/api/groups";
import type { NotificationItem } from "@/services/api/notifications";

/** Real /notifications page, replacing the earlier placeholder. */
export default function NotificationsPage(): JSX.Element {
  const { data: notifications, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();
  // Actionable notifications: join requests -> Review (My Projects);
  // invitations -> Accept/Decline (real membership on accept).
  const action = useMutation({
    mutationFn: async (input: { notification: NotificationItem; action: "accept" | "decline" }) => {
      const kind = input.notification.payload.kind as string | undefined;
      const requestId = input.notification.payload.requestId as string | undefined;
      if (!requestId) throw new Error("Missing request reference");
      // Group invitations route through the groups endpoints (same
      // JoinRequest record — no separate invitation systems).
      if (kind === "group_invitation") {
        return groupsApi.respondToInvitation(requestId, input.action);
      }
      return apiFetch(`/users/me/join-requests/${requestId}/${input.action}`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-join-requests"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Notifications</h1>
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
        <NotificationPanel
          notifications={notifications}
          onMarkRead={(id) => markRead.mutate(id)}
          onAction={(notification, a) => {
            if (a === "review") return;
            action.mutate({ notification, action: a });
          }}
        />
      )}
    </div>
  );
}
