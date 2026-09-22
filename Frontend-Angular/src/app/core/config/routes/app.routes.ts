/**
 * Single source of truth for frontend routes. Features must use these
 * constants instead of hard-coded strings (router config, links, redirects).
 */
export const APP_PATHS = {
  LOGIN: 'login',
  CHANGE_PASSWORD: 'change-password',
  DASHBOARD: 'dashboard',
  PLATFORM: {
    ROOT: 'platform',
    COMPANIES: 'companies',
    CREATE: 'new',
    DETAIL: ':companyId',
  },
  USERS: {
    ROOT: 'users',
    CREATE: 'new',
    DETAIL: ':userId',
  },
  SETTINGS: {
    ROOT: 'settings',
    COMPANY: 'company',
  },
  FORBIDDEN: 'forbidden',
  SALES_APP_ONLY: 'sales-app-only',
  SERVER_ERROR: 'error',
  NOT_FOUND: 'not-found',
} as const;

export const APP_ROUTES = {
  ROOT: '/',
  LOGIN: `/${APP_PATHS.LOGIN}`,
  CHANGE_PASSWORD: `/${APP_PATHS.CHANGE_PASSWORD}`,
  DASHBOARD: `/${APP_PATHS.DASHBOARD}`,
  PLATFORM: {
    COMPANIES: `/${APP_PATHS.PLATFORM.ROOT}/${APP_PATHS.PLATFORM.COMPANIES}`,
    COMPANY_CREATE: `/${APP_PATHS.PLATFORM.ROOT}/${APP_PATHS.PLATFORM.COMPANIES}/${APP_PATHS.PLATFORM.CREATE}`,
    COMPANY_DETAIL: (id: string) =>
      `/${APP_PATHS.PLATFORM.ROOT}/${APP_PATHS.PLATFORM.COMPANIES}/${id}`,
  },
  USERS: {
    ROOT: `/${APP_PATHS.USERS.ROOT}`,
    CREATE: `/${APP_PATHS.USERS.ROOT}/${APP_PATHS.USERS.CREATE}`,
    DETAIL: (id: string) => `/${APP_PATHS.USERS.ROOT}/${id}`,
  },
  SETTINGS: {
    COMPANY: `/${APP_PATHS.SETTINGS.ROOT}/${APP_PATHS.SETTINGS.COMPANY}`,
  },
  FORBIDDEN: `/${APP_PATHS.FORBIDDEN}`,
  SALES_APP_ONLY: `/${APP_PATHS.SALES_APP_ONLY}`,
  SERVER_ERROR: `/${APP_PATHS.SERVER_ERROR}`,
  NOT_FOUND: `/${APP_PATHS.NOT_FOUND}`,
} as const;
