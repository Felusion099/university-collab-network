import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PrivacySettings, NotificationPreferences } from "@app/shared-types";
import { settingsApi } from "@/services/api/settings";
import { useToastStore } from "@/stores/toast.store";

export function usePrivacySettings() {
  return useQuery({
    queryKey: ["settings-privacy"],
    queryFn: () => settingsApi.getPrivacy(),
  });
}

export function useUpdatePrivacySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Omit<PrivacySettings, "userId">>) =>
      settingsApi.updatePrivacy(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-privacy"] });
      useToastStore.getState().show("Privacy settings updated", "success");
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["settings-notification-preferences"],
    queryFn: () => settingsApi.getNotificationPreferences(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) =>
      settingsApi.updateNotificationPreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-notification-preferences"] });
      useToastStore.getState().show("Notification preferences updated", "success");
    },
  });
}
