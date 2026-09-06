import type {
  PrivacySettings,
  NotificationPreferences,
} from "@app/shared-types";

/**
 * Backs /settings. Unlike most services/api/*.ts files this phase, the
 * response shapes here are NOT invented — `PrivacySettings` and
 * `NotificationPreferences` are real, already-exported Zod-inferred types
 * from `packages/shared-types` (`user.ts`/`social.ts`), used directly.
 *
 * `GET/PATCH /users/me/privacy` is a real, already-documented endpoint
 * (API_CONTRACT.md §2). Notification preferences have a real schema
 * (`NotificationPreferencesSchema`, `social.ts`) but API_CONTRACT.md
 * never actually names an endpoint for it — assumed here to mirror the
 * privacy pattern exactly (`GET/PATCH /users/me/notification-preferences`)
 * since nothing else is documented; flagged in IMPLEMENTATION_STATUS.md
 * as an assumption to confirm, not a HANDOFF-worthy missing feature (the
 * schema already exists, just not the route documentation).
 */
let mockPrivacy: Omit<PrivacySettings, "userId"> = {
  profileVisibility: "university_only",
  emailVisibility: "connections_only",
  phoneVisibility: "private",
  academicVisibility: "university_only",
  cgpaVisibility: "private",
  projectsVisibility: "public",
  researchVisibility: "public",
  socialLinksVisibility: "connections_only",
  connectionsVisibility: "connections_only",
  activityVisibility: "university_only",
  contactVisibility: "connections_only",
};

let mockNotificationPreferences: NotificationPreferences = {
  connectionRequests: true,
  messages: true,
  projectInvitations: true,
  researchInvitations: true,
  clubAnnouncements: false,
  eventReminders: true,
  opportunityDeadlines: true,
  publications: false,
  teamRecruitment: true,
  profileInteractions: false,
};

export const settingsApi = {
  getPrivacy: async (): Promise<Omit<PrivacySettings, "userId">> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockPrivacy;
  },

  updatePrivacy: async (
    updates: Partial<Omit<PrivacySettings, "userId">>,
  ): Promise<Omit<PrivacySettings, "userId">> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    mockPrivacy = { ...mockPrivacy, ...updates };
    return mockPrivacy;
  },

  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockNotificationPreferences;
  },

  updateNotificationPreferences: async (
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    mockNotificationPreferences = { ...mockNotificationPreferences, ...updates };
    return mockNotificationPreferences;
  },
};
