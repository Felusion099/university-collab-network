import { create } from "zustand";
import type { AuthenticatedUser } from "@app/shared-types";

interface SessionState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  /** "idle" = boot-time refresh not yet attempted; "authenticated" and
   * "unauthenticated" are both terminal — ProtectedRoute only redirects
   * once status has left "idle", so a page refresh doesn't flash-redirect
   * to /login before the silent-refresh attempt finishes. */
  status: "idle" | "authenticated" | "unauthenticated";
  setSession: (user: AuthenticatedUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setSession: (user, accessToken) => set({ user, accessToken, status: "authenticated" }),
  setAccessToken: (accessToken) => set({ accessToken, status: "authenticated" }),
  clearSession: () => set({ user: null, accessToken: null, status: "unauthenticated" }),
}));
