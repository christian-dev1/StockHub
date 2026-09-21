/**
 * Single source of truth for Next.js frontend routes (locale prefix is added
 * by next-intl navigation helpers). Never hard-code paths in features.
 */
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CHANGE_PASSWORD: '/change-password',
  POS: '/pos',
  SCAN: '/scan',
  PRODUCTS: {
    ROOT: '/products',
    DETAIL: (id: string) => `/products/${encodeURIComponent(id)}`,
  },
  SALES: {
    ROOT: '/sales',
    DETAIL: (id: string) => `/sales/${encodeURIComponent(id)}`,
  },
  SETTINGS: '/settings',
  FORBIDDEN: '/forbidden',
} as const;
