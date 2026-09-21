/**
 * Permission codes mirrored from the backend. Used only to adapt the UI;
 * the backend remains the authority.
 */
export const PERMISSIONS = [
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
