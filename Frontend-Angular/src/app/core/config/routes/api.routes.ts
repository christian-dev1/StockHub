import { environment } from '../../../../environments/environment';

const API = environment.apiBaseUrl;
const ACTUATOR = environment.actuatorBaseUrl;

/**
 * Every backend endpoint used by the Angular app. Data sources must build
 * their URLs from here, never from inline strings.
 */
export const API_ROUTES = {
  BASE: API,
  SYSTEM: {
    HEALTH: `${ACTUATOR}/health`,
  },
  AUTH: {
    LOGIN: `${API}/auth/login`,
    REFRESH: `${API}/auth/refresh`,
    LOGOUT: `${API}/auth/logout`,
    ME: `${API}/auth/me`,
    CHANGE_PASSWORD: `${API}/auth/change-password`,
  },
  PLATFORM: {
    COMPANIES: `${API}/platform/companies`,
    COMPANY: (id: string) => `${API}/platform/companies/${encodeURIComponent(id)}`,
    COMPANY_DISABLE: (id: string) => `${API}/platform/companies/${encodeURIComponent(id)}/disable`,
    COMPANY_ACTIVATE: (id: string) =>
      `${API}/platform/companies/${encodeURIComponent(id)}/activate`,
    COMPANY_ADMINS: (id: string) => `${API}/platform/companies/${encodeURIComponent(id)}/admins`,
  },
  COMPANY: {
    CURRENT: `${API}/company`,
    SETTINGS: `${API}/company/settings`,
  },
  USERS: {
    ROOT: `${API}/users`,
    ONE: (id: string) => `${API}/users/${encodeURIComponent(id)}`,
    ROLE: (id: string) => `${API}/users/${encodeURIComponent(id)}/role`,
    LOCATIONS: (id: string) => `${API}/users/${encodeURIComponent(id)}/locations`,
    DISABLE: (id: string) => `${API}/users/${encodeURIComponent(id)}/disable`,
    ACTIVATE: (id: string) => `${API}/users/${encodeURIComponent(id)}/activate`,
    RESET_PASSWORD: (id: string) => `${API}/users/${encodeURIComponent(id)}/reset-password`,
  },
  ROLES: `${API}/roles`,
  LOCATIONS: {
    ROOT: `${API}/locations`,
  },
} as const;

/** Endpoints that must never carry a bearer token nor trigger a refresh loop. */
export const PUBLIC_AUTH_ENDPOINTS: readonly string[] = [
  API_ROUTES.AUTH.LOGIN,
  API_ROUTES.AUTH.REFRESH,
  API_ROUTES.AUTH.LOGOUT,
];
