import { apiFetch } from "./client";
import type {
  UserProfileResponse,
  OnboardingStatus,
  CompleteOnboardingRequest,
} from "@app/shared-types";

/**
 * Canonical self-profile API — GET /users/me (the JWT carries no username,
 * so the frontend cannot address itself via /users/:username), onboarding
 * status/complete, and the existing PATCH /users/me/profile passthrough.
 */
export const meApi = {
  getMe: async (): Promise<UserProfileResponse> => {
    return apiFetch<UserProfileResponse>("/users/me");
  },

  getOnboardingStatus: async (): Promise<OnboardingStatus> => {
    return apiFetch<OnboardingStatus>("/users/me/onboarding");
  },

  completeOnboarding: async (input: CompleteOnboardingRequest): Promise<OnboardingStatus> => {
    return apiFetch<OnboardingStatus>("/users/me/onboarding/complete", {
      method: "POST",
      body: input,
    });
  },

  updateProfile: async (input: Record<string, unknown>): Promise<UserProfileResponse> => {
    return apiFetch<UserProfileResponse>("/users/me/profile", {
      method: "PATCH",
      body: input,
    });
  },
};
