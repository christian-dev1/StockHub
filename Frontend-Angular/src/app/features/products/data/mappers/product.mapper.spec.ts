import { ProductModel } from '../models/product.model';
import { toImportPreview, toProduct, toProductRequest } from './product.mapper';

const model: ProductModel = {
  id: 'p1',
  sku: 'PRD-000001',
  barcode: null,
  barcodeFormat: null,
  name: 'Jus',
  description: null,
  categoryId: null,
  categoryName: null,
  defaultSupplierId: null,
  defaultSupplierName: null,
  unit: 'UNIT',
  purchasePrice: '300.0000' as unknown as number,
  salePrice: 500,
  minStock: 0,
  reorderQuantity: null,
  batchTracked: false,
  expiryTracked: false,
  active: true,
  hasImage: false,
  version: 3,
};

describe('product mapper', () => {
  it('turns amounts into numbers and keeps missing values null', () => {
    const product = toProduct(model);
    expect(product.purchasePrice).toBe(300);
    expect(product.reorderQuantity).toBeNull();
    expect(product.barcode).toBeNull();
  });

  it('sends blank texts as null so that the backend applies its defaults', () => {
    const body = toProductRequest({
      sku: ' ',
      barcode: '',
      barcodeFormat: null,
      name: 'Jus',
      description: '',
      categoryId: null,
      defaultSupplierId: 's1',
      unit: 'KG',
      purchasePrice: 1,
      salePrice: 2,
      minStock: 0.5,
      reorderQuantity: null,
      batchTracked: true,
      expiryTracked: false,
    });
    expect(body).toMatchObject({
      sku: null,
      barcode: null,
      description: null,
      defaultSupplierId: 's1',
    });
  });

  it('maps an import preview, renaming issue fields to columns', () => {
    const preview = toImportPreview({
      jobId: 'j1',
      fileName: 'a.csv',
      totalRows: 1,
      createCount: 0,
      updateCount: 0,
      errorCount: 1,
      categoriesToCreate: [],
      rows: [
        {
          rowNumber: 2,
          action: 'ERROR',
          sku: null,
          name: 'X',
          issues: [{ field: 'salePrice', code: 'PRODUCT_PRICE_NEGATIVE', message: 'm' }],
        },
      ],
      expiresAt: '2026-09-22T10:00:00Z',
    });
    expect(preview.rows[0].issues[0]).toEqual({
      column: 'salePrice',
      code: 'PRODUCT_PRICE_NEGATIVE',
      message: 'm',
    });
    expect(preview.expiresAt).toEqual(new Date('2026-09-22T10:00:00Z'));
  });
});
