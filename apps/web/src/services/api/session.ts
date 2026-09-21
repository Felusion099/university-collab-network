const TOKEN_KEY = 'ucn_access_token';

let accessToken: string | null = null;
try {
  accessToken = localStorage.getItem(TOKEN_KEY);
} catch {
  accessToken = null;
}

let sessionExpiredHandler: (() => void) | null = null;

export function onSessionExpired(handler: () => void): void {
  sessionExpiredHandler = handler;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode) — token stays in memory only
  }
}

export function clearSession(): void {
  accessToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  sessionExpiredHandler?.();
}
