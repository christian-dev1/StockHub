/**
 * Single source of truth for Next.js frontend routes (locale prefix is added
 * by next-intl navigation helpers). Never hard-code paths in features.
 * A route is only declared once its page exists, so that no link can lead to
 * a 404 (POS, scan, catalogue and sales arrive with their features).
 */
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CHANGE_PASSWORD: '/change-password',
  FORBIDDEN: '/forbidden',
} as const;
