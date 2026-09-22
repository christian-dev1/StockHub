import { BarcodeFormat, Unit } from '../../domain/entities/product';

/** Wire format of ProductResponse. */
export interface ProductModel {
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

export interface CategoryOptionModel {
  readonly id: string;
  readonly name: string;
  readonly parentName: string | null;
}

export interface SupplierOptionModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

export interface ImportIssueModel {
  readonly field: string | null;
  readonly code: string;
  readonly message: string;
}

export interface ImportPreviewModel {
  readonly jobId: string;
  readonly fileName: string;
  readonly totalRows: number;
  readonly createCount: number;
  readonly updateCount: number;
  readonly errorCount: number;
  readonly categoriesToCreate: string[];
  readonly rows: {
    readonly rowNumber: number;
    readonly action: 'CREATE' | 'UPDATE' | 'ERROR';
    readonly sku: string | null;
    readonly name: string | null;
    readonly issues: ImportIssueModel[];
  }[];
  readonly expiresAt: string;
}

export interface ImportResultModel {
  readonly jobId: string;
  readonly created: number;
  readonly updated: number;
  readonly categoriesCreated: number;
}
