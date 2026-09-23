import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/api/auth';
import { apiFetch } from '../services/api/client';
import { setAccessToken } from '../services/api/session';
import { API_MODE, type AppMode } from '../lib/config';
import { onSessionExpired, getAccessToken } from '../services/api/session';
import { liveRefreshMe } from '../services/api/live';
import { INITIAL_USERS } from '../data/mockData';
import type { User } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextType {
  mode: AppMode;
  status: AuthStatus;
  liveUser: User | null;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  otpLogin: (email: string, code: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    requestedRole: string,
  ) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  enterDemo: () => void;
  enterLive: () => void;
  refreshLiveUser: () => Promise<void>;
  setLiveUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modeOverride, setModeOverride] = useState<AppMode | null>(null);
  const mode: AppMode = modeOverride ?? API_MODE;
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (API_MODE === 'demo') return 'anonymous';
    return getAccessToken() ? 'loading' : 'anonymous';
  });
  const [liveUser, setLiveUser] = useState<User | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  /** Fetch the onboarding marker from the backend (users.onboarding_completed_at) */
  const fetchOnboardingStatus = useCallback(async (): Promise<boolean> => {
    try {
      const status = await apiFetch<{ completed: boolean }>('/users/me/onboarding');
      setOnboardingCompleted(status.completed);
      return status.completed;
    } catch {
      return false;
    }
  }, []);

  // Session expiry (401 → refresh failed) flips back to the login screen
  useEffect(() => {
    onSessionExpired(() => {
      if (mode === 'live') {
        setLiveUser(null);
        setStatus('anonymous');
      }
    });
  }, [mode]);

  // Restore session on boot in live mode
  useEffect(() => {
    if (mode !== 'live' || status !== 'loading') return;
    let cancelled = false;
    (async () => {
      const user = await liveRefreshMe();
      if (cancelled) return;
      if (user) {
        setLiveUser(user);
        setStatus('authenticated');
        await fetchOnboardingStatus();
      } else {
        setStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, status]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setLoginError(null);
      try {
        await authApi.login(email, password);
        const user = await liveRefreshMe();
        if (!user) {
          setLoginError('Signed in, but the profile could not be loaded.');
          return false;
        }
        setLiveUser(user);
        setStatus('authenticated');
        await fetchOnboardingStatus();
        return true;
      } catch (err) {
        let message: string;
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
        if (err instanceof TypeError || code === 'UNKNOWN_ERROR' || code === 'BAD_GATEWAY') {
          message = 'Cannot reach the API — is it running? Start it with: pnpm dev:api';
        } else if (err && typeof err === 'object' && 'message' in err && (err as Error).message) {
          message = (err as Error).message;
        } else {
          message = 'Sign in failed. Check your connection and try again.';
        }
        setLoginError(message);
        return false;
      }
    },
    [],
  );

  /** Passwordless: verify the 6-digit code → the account is created (signup)
   * or logged in (login) — the tokens come straight from the verify response. */
  const otpLogin = useCallback(
    async (email: string, code: string): Promise<boolean> => {
      setLoginError(null);
      try {
        const res = await apiFetch<{ accessToken: string }>('/auth/otp/verify', {
          method: 'POST',
          body: { email, code },
          skipAuthRetry: true,
        });
        setAccessToken(res.accessToken);
        const user = await liveRefreshMe();
        if (!user) {
          setLoginError('Verified, but the profile could not be loaded.');
          return false;
        }
        setLiveUser(user);
        setStatus('authenticated');
        await fetchOnboardingStatus();
        return true;
      } catch (err) {
        let message: string;
        const code2 = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
        if (err instanceof TypeError || code2 === 'UNKNOWN_ERROR') {
          message = 'Cannot reach the API — is it running? Start it with: pnpm dev:api';
        } else if (err && typeof err === 'object' && 'message' in err && (err as Error).message) {
          message = (err as Error).message;
        } else {
          message = 'Verification failed.';
        }
        setLoginError(message);
        return false;
      }
    },
    [],
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      requestedRole: string,
    ): Promise<{ ok: boolean; message: string }> => {
      setLoginError(null);
      try {
        await authApi.signup(email, password, fullName, requestedRole);
        return {
          ok: true,
          message:
            'Account created. A verification link was logged by the dev mail service — you can sign in right away.',
        };
      } catch (err) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as Error).message)
            : 'Sign up failed. Check your connection and try again.';
        return { ok: false, message };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — clear locally regardless
    }
    setLiveUser(null);
    setOnboardingCompleted(false);
    setStatus('anonymous');
  }, []);

  const enterDemo = useCallback(() => {
    setLoginError(null);
    setModeOverride('demo');
  }, []);

  const enterLive = useCallback(() => {
    setModeOverride('live');
    setStatus(getAccessToken() ? 'loading' : 'anonymous');
  }, []);

  const refreshLiveUser = useCallback(async () => {
    const user = await liveRefreshMe();
    if (user) setLiveUser(user);
  }, []);

  // Demo mode seeds the demo persona list so the UI can render immediately
  const demoFallback: User[] = INITIAL_USERS;

  return (
    <AuthContext.Provider
      value={{
        mode,
        status,
        liveUser: liveUser ?? (mode === 'demo' ? demoFallback[0] ?? null : null),
        onboardingCompleted,
        setOnboardingCompleted,
        loginError,
        login,
        otpLogin,
        signup,
        logout,
        enterDemo,
        enterLive,
        refreshLiveUser,
        setLiveUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
