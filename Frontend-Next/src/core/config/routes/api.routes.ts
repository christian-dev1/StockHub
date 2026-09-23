import { env } from '../env';

const API = env.apiBaseUrl;

/** Every backend endpoint used by the Next.js app. */
export const API_ROUTES = {
  BASE: API,
  SYSTEM: {
    HEALTH: `${env.actuatorBaseUrl}/health`,
  },
  AUTH: {
    LOGIN: `${API}/auth/login`,
    REFRESH: `${API}/auth/refresh`,
    LOGOUT: `${API}/auth/logout`,
    ME: `${API}/auth/me`,
    CHANGE_PASSWORD: `${API}/auth/change-password`,
  },
  LOCATIONS: `${API}/locations`,
  CATEGORIES: `${API}/categories`,
  SALES: {
    ROOT: `${API}/sales`,
    ONE: (id: string) => `${API}/sales/${encodeURIComponent(id)}`,
    MY_SUMMARY: `${API}/sales/me/summary`,
    SETTINGS: `${API}/sales/settings`,
    CATALOGUE: `${API}/sales/catalogue`,
    CATALOGUE_ITEM: (productId: string) => `${API}/sales/catalogue/${encodeURIComponent(productId)}`,
  },
} as const;

/** Endpoints that never carry a bearer token nor trigger a refresh. */
export const PUBLIC_AUTH_ENDPOINTS: readonly string[] = [
  API_ROUTES.AUTH.LOGIN,
  API_ROUTES.AUTH.REFRESH,
  API_ROUTES.AUTH.LOGOUT,
];
