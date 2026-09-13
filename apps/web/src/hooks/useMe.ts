import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { meApi } from "@/services/api/me";

/**
 * Self-profile + onboarding state hooks. `useMe` is the canonical source
 * for the logged-in user's full profile (including the composed portfolio
 * view); `useOnboardingStatus` drives the resume-onboarding guard.
 */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => meApi.getMe(),
  });
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding"],
    queryFn: () => meApi.getOnboardingStatus(),
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => meApi.completeOnboarding({ completed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useUpdateOwnProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => meApi.updateProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
