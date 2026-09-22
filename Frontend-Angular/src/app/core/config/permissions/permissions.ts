/**
 * Permission codes, mirrored from the backend. The frontend only uses them to
 * adapt the UI (hide actions, guard routes); the backend always re-checks.
 */
export const PERMISSIONS = [
  'PLATFORM_STATS_VIEW',
  'PLATFORM_SETTINGS_MANAGE',
  'SUPPORT_SESSION_OPEN',
  'COMPANY_VIEW',
  'COMPANY_CREATE',
  'COMPANY_UPDATE',
  'COMPANY_DISABLE',
  'USER_VIEW',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DISABLE',
  'WAREHOUSE_VIEW',
  'WAREHOUSE_CREATE',
  'WAREHOUSE_UPDATE',
  'CATEGORY_VIEW',
  'CATEGORY_MANAGE',
  'PRODUCT_VIEW',
  'PRODUCT_CREATE',
  'PRODUCT_UPDATE',
  'PRODUCT_DELETE',
  'PRODUCT_IMPORT',
  'BARCODE_GENERATE',
  'BARCODE_PRINT',
  'SUPPLIER_VIEW',
  'SUPPLIER_CREATE',
  'SUPPLIER_UPDATE',
  'STOCK_VIEW',
  'STOCK_ENTRY',
  'STOCK_EXIT',
  'STOCK_ADJUST',
  'STOCK_TRANSFER',
  'BATCH_MANAGE',
  'INVENTORY_VIEW',
  'INVENTORY_CREATE',
  'INVENTORY_COUNT',
  'INVENTORY_VALIDATE',
  'PURCHASE_ORDER_VIEW',
  'PURCHASE_ORDER_CREATE',
  'PURCHASE_ORDER_VALIDATE',
  'PURCHASE_ORDER_RECEIVE',
  'SALE_CREATE',
  'SALE_VIEW',
  'SALE_CANCEL',
  'RECEIPT_REPRINT',
  'ALERT_VIEW',
  'ALERT_MANAGE',
  'REPORT_VIEW',
  'REPORT_EXPORT',
  'FORECAST_VIEW',
  'AUDIT_VIEW',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type RoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MAGASINIER' | 'VENDEUR';

/**
 * Roles allowed in this back-office. Sellers (VENDEUR) work in the sales app
 * (Frontend-Next); the backend enforces permissions either way.
 */
export const BACK_OFFICE_ROLES: readonly RoleCode[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'MAGASINIER',
];
