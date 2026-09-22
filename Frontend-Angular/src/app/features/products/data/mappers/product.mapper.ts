import {
  CategoryOption,
  Product,
  ProductDraft,
  SupplierOption,
} from '../../domain/entities/product';
import { ImportPreview, ImportResult } from '../../domain/entities/product-import';
import {
  CategoryOptionModel,
  ImportPreviewModel,
  ImportResultModel,
  ProductModel,
  SupplierOptionModel,
} from '../models/product.model';

/** Amounts arrive as JSON numbers (BigDecimal); null-safe for optional ones. */
export function toProduct(model: ProductModel): Product {
  return {
    id: model.id,
    sku: model.sku,
    barcode: model.barcode ?? null,
    barcodeFormat: model.barcodeFormat ?? null,
    name: model.name,
    description: model.description ?? null,
    categoryId: model.categoryId ?? null,
    categoryName: model.categoryName ?? null,
    defaultSupplierId: model.defaultSupplierId ?? null,
    defaultSupplierName: model.defaultSupplierName ?? null,
    unit: model.unit,
    purchasePrice: Number(model.purchasePrice ?? 0),
    salePrice: Number(model.salePrice ?? 0),
    minStock: Number(model.minStock ?? 0),
    reorderQuantity:
      model.reorderQuantity === null || model.reorderQuantity === undefined
        ? null
        : Number(model.reorderQuantity),
    batchTracked: model.batchTracked,
    expiryTracked: model.expiryTracked,
    active: model.active,
    hasImage: model.hasImage,
    version: model.version,
  };
}

/** Body of ProductRequest: blank strings become null so that the backend applies its defaults. */
export function toProductRequest(draft: ProductDraft): Record<string, unknown> {
  const blank = (value: string) => (value.trim() ? value : null);
  return {
    sku: blank(draft.sku),
    barcode: blank(draft.barcode),
    barcodeFormat: draft.barcodeFormat,
    name: draft.name,
    description: blank(draft.description),
    categoryId: draft.categoryId,
    defaultSupplierId: draft.defaultSupplierId,
    unit: draft.unit,
    purchasePrice: draft.purchasePrice,
    salePrice: draft.salePrice,
    minStock: draft.minStock,
    reorderQuantity: draft.reorderQuantity,
    batchTracked: draft.batchTracked,
    expiryTracked: draft.expiryTracked,
  };
}

export function toCategoryOption(model: CategoryOptionModel): CategoryOption {
  return { id: model.id, name: model.name, parentName: model.parentName ?? null };
}

export function toSupplierOption(model: SupplierOptionModel): SupplierOption {
  return { id: model.id, code: model.code, name: model.name };
}

export function toImportPreview(model: ImportPreviewModel): ImportPreview {
  return {
    jobId: model.jobId,
    fileName: model.fileName,
    totalRows: model.totalRows,
    createCount: model.createCount,
    updateCount: model.updateCount,
    errorCount: model.errorCount,
    categoriesToCreate: model.categoriesToCreate ?? [],
    rows: model.rows.map((row) => ({
      rowNumber: row.rowNumber,
      action: row.action,
      sku: row.sku ?? null,
      name: row.name ?? null,
      issues: (row.issues ?? []).map((issue) => ({
        column: issue.field ?? null,
        code: issue.code,
        message: issue.message,
      })),
    })),
    expiresAt: new Date(model.expiresAt),
  };
}

export function toImportResult(model: ImportResultModel): ImportResult {
  return {
    created: model.created,
    updated: model.updated,
    categoriesCreated: model.categoriesCreated,
  };
}
