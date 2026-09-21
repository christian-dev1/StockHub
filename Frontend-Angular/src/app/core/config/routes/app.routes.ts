/**
 * Single source of truth for frontend routes. Features must use these
 * constants instead of hard-coded strings (router config, links, redirects).
 */
export const APP_PATHS = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  FORBIDDEN: 'forbidden',
  SERVER_ERROR: 'error',
  NOT_FOUND: 'not-found',
} as const;

export const APP_ROUTES = {
  ROOT: '/',
  LOGIN: `/${APP_PATHS.LOGIN}`,
  DASHBOARD: `/${APP_PATHS.DASHBOARD}`,
  FORBIDDEN: `/${APP_PATHS.FORBIDDEN}`,
  SERVER_ERROR: `/${APP_PATHS.SERVER_ERROR}`,
  NOT_FOUND: `/${APP_PATHS.NOT_FOUND}`,
} as const;
