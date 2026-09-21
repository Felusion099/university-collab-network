import type { LoginResponse, SignupResponse, UserProfileResponse } from '@app/shared-types';
import { apiFetch } from './client';
import { setAccessToken, clearSession } from './session';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuthRetry: true,
    });
    setAccessToken(res.accessToken);
    return res;
  },

  signup: async (
    email: string,
    password: string,
    fullName: string,
    requestedRole: string,
  ): Promise<SignupResponse> => {
    return apiFetch<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: { email, password, fullName, requestedRole },
      skipAuthRetry: true,
    });
  },

  me: async (): Promise<UserProfileResponse> => {
    // GET /users/me — the full profile endpoint (username, role profiles,
    // portfolio). /auth/me only returns the lean {id, email, role, status}
    // shape, which the UI's user mapper cannot render from.
    return apiFetch<UserProfileResponse>('/users/me');
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  },
};
