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
    ONE: (id: string) => `${API}/locations/${encodeURIComponent(id)}`,
    ACTIVATE: (id: string) => `${API}/locations/${encodeURIComponent(id)}/activate`,
    DEACTIVATE: (id: string) => `${API}/locations/${encodeURIComponent(id)}/deactivate`,
    SET_PRIMARY: (id: string) => `${API}/locations/${encodeURIComponent(id)}/set-primary`,
  },
  CATEGORIES: {
    ROOT: `${API}/categories`,
    ONE: (id: string) => `${API}/categories/${encodeURIComponent(id)}`,
  },
  SUPPLIERS: {
    ROOT: `${API}/suppliers`,
    ONE: (id: string) => `${API}/suppliers/${encodeURIComponent(id)}`,
    ACTIVATE: (id: string) => `${API}/suppliers/${encodeURIComponent(id)}/activate`,
    DEACTIVATE: (id: string) => `${API}/suppliers/${encodeURIComponent(id)}/deactivate`,
  },
  PRODUCTS: {
    ROOT: `${API}/products`,
    ONE: (id: string) => `${API}/products/${encodeURIComponent(id)}`,
    LOOKUP: `${API}/products/lookup`,
    ACTIVATE: (id: string) => `${API}/products/${encodeURIComponent(id)}/activate`,
    DEACTIVATE: (id: string) => `${API}/products/${encodeURIComponent(id)}/deactivate`,
    IMAGE: (id: string) => `${API}/products/${encodeURIComponent(id)}/image`,
    IMPORT_TEMPLATE: `${API}/products/imports/template`,
    IMPORT_PREVIEW: `${API}/products/imports/preview`,
    IMPORT_COMMIT: (jobId: string) => `${API}/products/imports/${encodeURIComponent(jobId)}/commit`,
  },
  STOCK: {
    LEVELS: `${API}/stocks`,
    PRODUCT_LEVELS: (productId: string) => `${API}/stocks/${encodeURIComponent(productId)}`,
    MOVEMENTS: `${API}/stock-movements`,
    MOVEMENT: (id: string) => `${API}/stock-movements/${encodeURIComponent(id)}`,
    ENTRIES: `${API}/stock/entries`,
    EXITS: `${API}/stock/exits`,
    ADJUSTMENTS: `${API}/stock/adjustments`,
    TRANSFERS: `${API}/stock/transfers`,
    DOCUMENTS: `${API}/stock-documents`,
    DOCUMENT: (id: string) => `${API}/stock-documents/${encodeURIComponent(id)}`,
  },
  BATCHES: {
    ROOT: `${API}/batches`,
    ONE: (id: string) => `${API}/batches/${encodeURIComponent(id)}`,
  },
  BARCODES: {
    GENERATE: (productId: string) => `${API}/products/${encodeURIComponent(productId)}/barcode`,
    PNG: (productId: string) => `${API}/products/${encodeURIComponent(productId)}/barcode.png`,
    SVG: (productId: string) => `${API}/products/${encodeURIComponent(productId)}/barcode.svg`,
    LABELS: `${API}/barcodes/labels`,
  },
} as const;

/** Endpoints that must never carry a bearer token nor trigger a refresh loop. */
export const PUBLIC_AUTH_ENDPOINTS: readonly string[] = [
  API_ROUTES.AUTH.LOGIN,
  API_ROUTES.AUTH.REFRESH,
  API_ROUTES.AUTH.LOGOUT,
];
