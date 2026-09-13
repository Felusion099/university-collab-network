import { apiFetch } from "./client";
import type {
  UserProfileResponse,
  OnboardingStatus,
  CompleteOnboardingRequest,
} from "@app/shared-types";

export interface VerificationStatus {
  role: string;
  isUniversityVerified: boolean;
  request: {
    id: string;
    roleClaimed: string;
    status: string;
    evidenceUrl: string | null;
    submittedAt: string;
    reviewedAt: string;
  } | null;
}

/**
 * Canonical self-profile API — GET /users/me (the JWT carries no username,
 * so the frontend cannot address itself via /users/:username), onboarding
 * status/complete, verification request/status, and the existing
 * PATCH /users/me/profile passthrough.
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

  getVerificationStatus: async (): Promise<VerificationStatus> => {
    return apiFetch<VerificationStatus>("/users/me/verification");
  },

  requestVerification: async (input: {
    roleClaimed?: string;
    evidenceUrl?: string;
  }): Promise<Record<string, unknown>> => {
    return apiFetch<Record<string, unknown>>("/users/me/verification", {
      method: "POST",
      body: input,
    });
  },
};
