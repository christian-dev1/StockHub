export interface GeneratedBarcodeModel {
  readonly barcode: string;
  readonly barcodeFormat: string;
}

/** Subset of ProductResponse needed for labels. */
export interface LabelProductModel {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly barcode: string | null;
  readonly salePrice: number;
}
