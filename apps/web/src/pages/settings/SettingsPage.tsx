import type { NotificationPreferences } from "@app/shared-types";
import {
  usePrivacySettings,
  useUpdatePrivacySettings,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useSettings";
import { PrivacyControls } from "@/components/PrivacyControls";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

const NOTIFICATION_LABELS: Record<keyof NotificationPreferences, string> = {
  connectionRequests: "Connection requests",
  messages: "Messages",
  projectInvitations: "Project invitations",
  researchInvitations: "Research invitations",
  clubAnnouncements: "Club announcements",
  eventReminders: "Event reminders",
  opportunityDeadlines: "Opportunity deadlines",
  publications: "Publications",
  teamRecruitment: "Team recruitment",
  profileInteractions: "Profile interactions",
};

/**
 * Real /settings page, replacing the earlier placeholder — privacy
 * controls (real `PrivacySettings` schema) and notification preferences
 * (real `NotificationPreferences` schema), per FILE_STRUCTURE.md's
 * "(incl. privacy)" note on this route.
 */
export default function SettingsPage(): JSX.Element {
  const {
    data: privacy,
    isLoading: privacyLoading,
    isError: privacyError,
    refetch: refetchPrivacy,
  } = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacySettings();

  const {
    data: notificationPrefs,
    isLoading: notifLoading,
    isError: notifError,
    refetch: refetchNotif,
  } = useNotificationPreferences();
  const updateNotifPrefs = useUpdateNotificationPreferences();

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>

      <section>
        <h2 className="mb-1 text-lg font-medium text-text-primary">Privacy</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Control who can see each part of your profile.
        </p>
        {privacyLoading && <Skeleton className="h-64 w-full rounded-lg" />}
        {privacyError && (
          <ErrorState title="Couldn't load privacy settings" onRetry={() => refetchPrivacy()} />
        )}
        {privacy && (
          <PrivacyControls
            values={privacy}
            onChange={(field, value) => updatePrivacy.mutate({ [field]: value })}
          />
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-medium text-text-primary">Notifications</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Choose which notifications you want to receive.
        </p>
        {notifLoading && <Skeleton className="h-64 w-full rounded-lg" />}
        {notifError && (
          <ErrorState
            title="Couldn't load notification preferences"
            onRetry={() => refetchNotif()}
          />
        )}
        {notificationPrefs && (
          <div className="space-y-3">
            {(Object.keys(NOTIFICATION_LABELS) as (keyof NotificationPreferences)[]).map((key) => (
              <label key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-text-primary">{NOTIFICATION_LABELS[key]}</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs[key]}
                  onChange={(e) => updateNotifPrefs.mutate({ [key]: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-accent-600 focus:ring-[var(--focus-ring)]"
                />
              </label>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
