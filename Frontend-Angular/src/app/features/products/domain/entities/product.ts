export const UNITS = ['UNIT', 'KG', 'G', 'L', 'ML', 'M', 'BOX', 'PACK'] as const;
export type Unit = (typeof UNITS)[number];

export const BARCODE_FORMATS = ['EAN13', 'EAN8', 'UPC_A', 'CODE128'] as const;
export type BarcodeFormat = (typeof BARCODE_FORMATS)[number];

/** A catalogue article. It holds no stock quantity: stock lives per location in the stock module. */
export interface Product {
  readonly id: string;
  readonly sku: string;
  readonly barcode: string | null;
  readonly barcodeFormat: BarcodeFormat | null;
  readonly name: string;
  readonly description: string | null;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly defaultSupplierId: string | null;
  readonly defaultSupplierName: string | null;
  readonly unit: Unit;
  readonly purchasePrice: number;
  readonly salePrice: number;
  readonly minStock: number;
  readonly reorderQuantity: number | null;
  readonly batchTracked: boolean;
  readonly expiryTracked: boolean;
  readonly active: boolean;
  readonly hasImage: boolean;
  readonly version: number;
}

/**
 * Editable fields. A blank `sku` is generated on creation and kept on update;
 * a blank `barcode` removes it; a null `barcodeFormat` lets the backend detect it.
 */
export interface ProductDraft {
  readonly sku: string;
  readonly barcode: string;
  readonly barcodeFormat: BarcodeFormat | null;
  readonly name: string;
  readonly description: string;
  readonly categoryId: string | null;
  readonly defaultSupplierId: string | null;
  readonly unit: Unit;
  readonly purchasePrice: number | null;
  readonly salePrice: number | null;
  readonly minStock: number | null;
  readonly reorderQuantity: number | null;
  readonly batchTracked: boolean;
  readonly expiryTracked: boolean;
}

export interface ProductFilters {
  readonly text: string;
  readonly categoryId: string | null;
  readonly supplierId: string | null;
  readonly active: boolean | null;
  readonly hasBarcode: boolean | null;
  readonly batchTracked: boolean | null;
}

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
  text: '',
  categoryId: null,
  supplierId: null,
  active: null,
  hasBarcode: null,
  batchTracked: null,
};

export interface CategoryOption {
  readonly id: string;
  readonly name: string;
  readonly parentName: string | null;
}

export interface SupplierOption {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

/** Units counted in whole numbers (same rule as the backend). */
export function isDiscrete(unit: Unit): boolean {
  return unit === 'UNIT' || unit === 'BOX' || unit === 'PACK';
}

/** Expiry dates live on batches: expiry tracking implies batch tracking. */
export function consistentTracking(tracking: { batchTracked: boolean; expiryTracked: boolean }): {
  batchTracked: boolean;
  expiryTracked: boolean;
} {
  return tracking.expiryTracked ? { batchTracked: true, expiryTracked: true } : tracking;
}

/** Selling below the purchase price is allowed (promotions) but worth a warning. */
export function sellsAtLoss(product: Pick<Product, 'purchasePrice' | 'salePrice'>): boolean {
  return product.salePrice < product.purchasePrice;
}

/** Margin rate on the sale price, or null when it cannot be computed. */
export function marginRate(product: Pick<Product, 'purchasePrice' | 'salePrice'>): number | null {
  return product.salePrice > 0
    ? (product.salePrice - product.purchasePrice) / product.salePrice
    : null;
}
