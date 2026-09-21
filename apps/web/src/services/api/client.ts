import type { ErrorResponse, LoginResponse, SignupResponse } from '@app/shared-types';
import { API_BASE_URL } from '../../lib/config';
import { getAccessToken, setAccessToken, clearSession } from './session';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(status: number, body: ErrorResponse['error']) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Skip the automatic 401-refresh-retry — used by the refresh call itself
   * to avoid an infinite loop, and by login/signup where a 401 is expected
   * user-facing behavior, not a stale-session condition. */
  skipAuthRetry?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

/** POST /auth/refresh (httpOnly cookie carries the refresh token — never
 * touched directly by client code). De-duplicates concurrent callers so a
 * burst of 401s doesn't fire multiple refresh requests at once. */
async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken: string };
        setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuthRetry = false } = options;

  const doFetch = async (): Promise<Response> => {
    const token = getAccessToken();
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include', // sends the httpOnly refresh cookie on /auth/refresh
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await doFetch();
    } else {
      clearSession();
    }
  }

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ErrorResponse | null;
    throw new ApiError(
      res.status,
      errorBody?.error ?? { code: 'UNKNOWN_ERROR', message: res.statusText },
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
