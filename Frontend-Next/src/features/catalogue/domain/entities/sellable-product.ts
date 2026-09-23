/** Units whose quantities are whole numbers (same rule as the backend). */
export const DISCRETE_UNITS: readonly string[] = ['UNIT', 'BOX', 'PACK'];

/** A product as the point of sale sees it: no purchase price, availability at one location. */
export interface SellableProduct {
  readonly id: string;
  readonly sku: string;
  readonly barcode: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly unit: string;
  readonly salePrice: number;
  readonly batchTracked: boolean;
  readonly availableQuantity: number;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
}

export interface CatalogueQuery {
  readonly locationId: string;
  readonly search?: string;
  readonly categoryId?: string;
  readonly inStock?: boolean;
  readonly page?: number;
  readonly size?: number;
}
