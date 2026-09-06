import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  AuthenticatedUser,
} from "@app/shared-types";
import { apiFetch } from "./client";

// One function per endpoint, mirroring API_CONTRACT.md — thin wrappers so
// callers (hooks/useAuth.ts) never construct paths or payloads by hand.
export const authApi = {
  signup: (input: SignupRequest) =>
    apiFetch<SignupResponse>("/auth/signup", { method: "POST", body: input, skipAuthRetry: true }),

  login: (input: LoginRequest) =>
    apiFetch<LoginResponse>("/auth/login", { method: "POST", body: input, skipAuthRetry: true }),

  refresh: () =>
    apiFetch<RefreshResponse>("/auth/refresh", { method: "POST", skipAuthRetry: true }),

  // Resolves HANDOFF-21 — used by useRestoreSession() to re-hydrate `user`
  // after POST /auth/refresh restores accessToken on a page reload.
  // accessTokenOverride: useRestoreSession calls this BEFORE committing the
  // freshly-refreshed token to the session store (see client.ts), so the
  // token has to be passed explicitly rather than read from the store.
  // skipAuthRetry: a 401 here means the just-restored token is already
  // invalid; retrying through the normal refresh-and-retry path would loop
  // back into the same refresh call useRestoreSession just made.
  me: (options: { accessTokenOverride: string }) =>
    apiFetch<AuthenticatedUser>("/auth/me", { skipAuthRetry: true, ...options }),

  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),

  verifyEmail: (input: VerifyEmailRequest) =>
    apiFetch<VerifyEmailResponse>("/auth/verify-email", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    }),

  forgotPassword: (input: ForgotPasswordRequest) =>
    apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    }),

  resetPassword: (input: ResetPasswordRequest) =>
    apiFetch<ResetPasswordResponse>("/auth/reset-password", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    }),
};
