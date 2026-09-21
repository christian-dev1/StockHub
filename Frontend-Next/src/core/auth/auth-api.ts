import { httpRequest } from '../api/http-client';
import { API_ROUTES } from '../config/routes/api.routes';
import type { TokenResponse } from './session';
import { sessionStore } from './session-store';

let refreshInFlight: Promise<string> | null = null;

/** Single-flight refresh: concurrent 401s share one call; failure clears the session. */
export function refreshSession(): Promise<string> {
  refreshInFlight ??= httpRequest<TokenResponse>(API_ROUTES.AUTH.REFRESH, { method: 'POST' })
    .then((response) => {
      sessionStore.apply(response);
      return response.accessToken;
    })
    .catch((error: unknown) => {
      sessionStore.clear();
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const response = await httpRequest<TokenResponse>(API_ROUTES.AUTH.LOGIN, {
    method: 'POST',
    body: { email, password },
  });
  sessionStore.apply(response);
  return response;
}

export async function logout(): Promise<void> {
  try {
    await httpRequest<void>(API_ROUTES.AUTH.LOGOUT, { method: 'POST' });
  } finally {
    sessionStore.clear();
  }
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return httpRequest<void>(API_ROUTES.AUTH.CHANGE_PASSWORD, {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}
