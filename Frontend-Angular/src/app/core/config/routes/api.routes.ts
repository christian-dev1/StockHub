import { environment } from '../../../../environments/environment';

const API = environment.apiBaseUrl;
const ACTUATOR = environment.actuatorBaseUrl;

/**
 * Every backend endpoint used by the Angular app. Data sources must build
 * their URLs from here, never from inline strings.
 */
export const API_ROUTES = {
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
} as const;
