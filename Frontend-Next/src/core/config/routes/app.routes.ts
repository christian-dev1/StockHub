/**
 * Single source of truth for Next.js frontend routes (locale prefix is added
 * by next-intl navigation helpers). Never hard-code paths in features.
 * A route is only declared once its page exists, so that no link can lead to
 * a 404.
 */
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CHANGE_PASSWORD: '/change-password',
  FORBIDDEN: '/forbidden',
  PRODUCTS: '/products',
  PRODUCT: (id: string) => `/products/${encodeURIComponent(id)}`,
  SALES: '/sales',
  NEW_SALE: '/sales/new',
  SALE: (id: string) => `/sales/${encodeURIComponent(id)}`,
  PROFILE: '/profile',
  PREFERENCES: '/preferences',
} as const;
