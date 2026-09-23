/** GET /sales/catalogue item; null fields are omitted by the backend. */
export interface SellableProductModel {
  readonly id: string;
  readonly sku: string;
  readonly barcode?: string;
  readonly name: string;
  readonly description?: string;
  readonly categoryId?: string;
  readonly categoryName?: string;
  readonly unit: string;
  readonly salePrice: number | string;
  readonly batchTracked: boolean;
  readonly availableQuantity: number | string;
}

/** GET /categories item. */
export interface CategoryModel {
  readonly id: string;
  readonly name: string;
  readonly parentId?: string;
}
