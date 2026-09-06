import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { LoginRequest, SignupRequest } from "@app/shared-types";
import { authApi } from "@/services/api/auth";
import { ApiError } from "@/services/api/client";
import { useSessionStore } from "@/stores/session.store";

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: (data) => setSession(data.user, data.accessToken),
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (input: SignupRequest) => authApi.signup(input),
  });
}

export function useLogout() {
  const clearSession = useSessionStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Clear regardless of whether the network call succeeded â€” the user
      // clicked logout, the client-side session ends either way.
      clearSession();
      queryClient.clear();
    },
  });
}

/**
 * Restores the full session (accessToken + user) on app load via the
 * httpOnly refresh cookie, so a page refresh doesn't force a re-login.
 * Runs once, from <App>.
 *
 * HANDOFF-21 (resolved): POST /auth/refresh only ever returns a bare
 * accessToken â€” the JWT itself carries no name/role/status â€” so restoring
 * `user` requires a second call to GET /auth/me once the fresh token is in
 * hand. Deliberately does NOT call setAccessToken() here (unlike
 * client.ts's mid-session refresh, where a user is already in the store):
 * committing a token to the store before /auth/me resolves would flip
 * status to "authenticated" with no user attached yet, which is exactly
 * the falsely-authenticated state ProtectedRoute must never see. Instead
 * the fresh token is held locally and passed straight to /auth/me via
 * accessTokenOverride; only setSession()'s atomic (user, accessToken) pair
 * commits anything to the store, and only on success. If /auth/me rejects
 * the token (expired/invalid/suspended between refresh and me, etc.), the
 * session is cleared instead.
 */
export function useRestoreSession() {
  const status = useSessionStore((s) => s.status);
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  useEffect(() => {
    if (status !== "idle") return;
    authApi
      .refresh()
      .then(async (data) => {
        // Not setAccessToken() here â€” see the doc comment above. We hold
        // the token locally and only commit it to the store together with
        // the user, via setSession(), once /auth/me confirms it's valid.
        const user = await authApi.me({ accessTokenOverride: data.accessToken });
        setSession(user, data.accessToken);
      })
      .catch((err) => {
        // No refresh cookie, it's expired/invalid, or /auth/me rejected the
        // freshly-restored token â€” all of these are the normal logged-out
        // case, not an error to surface to the user.
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          return;
        }
        clearSession();
      });
  }, [status, setSession, clearSession]);
}

