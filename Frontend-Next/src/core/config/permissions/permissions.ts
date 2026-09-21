/**
 * Permission codes mirrored from the backend. Used only to adapt the UI;
 * the backend remains the authority.
 */
export const PERMISSIONS = [
  'USER_VIEW',
  'PRODUCT_VIEW',
  'STOCK_VIEW',
  'WAREHOUSE_VIEW',
  'CATEGORY_VIEW',
  'SALE_CREATE',
  'SALE_VIEW',
  'SALE_CANCEL',
  'RECEIPT_REPRINT',
  'REPORT_VIEW',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type RoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MAGASINIER' | 'VENDEUR';

/** Roles allowed in the sales app; the platform super admin works in the back-office. */
export const SALES_APP_ROLES: readonly RoleCode[] = ['ADMIN', 'MANAGER', 'MAGASINIER', 'VENDEUR'];
