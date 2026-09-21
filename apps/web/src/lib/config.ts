export type AppMode = 'live' | 'demo';

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;

export const API_MODE: AppMode = env.VITE_API_MODE === 'live' ? 'live' : 'demo';

// Default: same-origin /api/v1 (the Vite dev proxy forwards to the API on
// port 4000 — no CORS, works from any host). Override with VITE_API_BASE_URL
// when the API lives elsewhere (e.g. production).
export const API_BASE_URL: string =
  env.VITE_API_BASE_URL || '/api/v1';

export const isLiveMode = (): boolean => API_MODE === 'live';
