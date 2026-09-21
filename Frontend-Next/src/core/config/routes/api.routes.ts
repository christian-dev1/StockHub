import { env } from '../env';

const API = env.apiBaseUrl;

/** Every backend endpoint used by the Next.js app. */
export const API_ROUTES = {
  SYSTEM: {
    HEALTH: `${env.actuatorBaseUrl}/health`,
  },
  AUTH: {
    LOGIN: `${API}/auth/login`,
    REFRESH: `${API}/auth/refresh`,
    LOGOUT: `${API}/auth/logout`,
    ME: `${API}/auth/me`,
  },
} as const;
