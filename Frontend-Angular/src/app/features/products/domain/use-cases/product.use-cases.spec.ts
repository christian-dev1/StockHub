import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProductDraft } from '../entities/product';
import { ProductsRepository } from '../repositories/products.repository';
import { SaveProductUseCase, normalizeProduct } from './product.use-cases';

const draft: ProductDraft = {
  sku: ' riz-5 ',
  barcode: ' ',
  barcodeFormat: 'EAN13',
  name: '  Riz  ',
  description: ' ',
  categoryId: null,
  defaultSupplierId: null,
  unit: 'KG',
  purchasePrice: null,
  salePrice: 900,
  minStock: null,
  reorderQuantity: null,
  batchTracked: false,
  expiryTracked: true,
};

describe('normalizeProduct', () => {
  it('trims, upper-cases the SKU, zeroes empty amounts and keeps tracking consistent', () => {
    expect(normalizeProduct(draft)).toMatchObject({
      sku: 'RIZ-5',
      name: 'Riz',
      barcode: '',
      barcodeFormat: null,
      purchasePrice: 0,
      minStock: 0,
      batchTracked: true,
      expiryTracked: true,
    });
  });
});

describe('SaveProductUseCase', () => {
  it('deactivates a product created as inactive', () => {
    const created = { id: 'p1' };
    const repository = {
      create: vi.fn().mockReturnValue(of(created)),
      deactivate: vi.fn().mockReturnValue(of({ ...created, active: false })),
    };
    TestBed.configureTestingModule({
      providers: [SaveProductUseCase, { provide: ProductsRepository, useValue: repository }],
    });
    const useCase = TestBed.inject(SaveProductUseCase);

    useCase.create(draft, true).subscribe();
    expect(repository.deactivate).not.toHaveBeenCalled();
    useCase.create(draft, false).subscribe();
    expect(repository.deactivate).toHaveBeenCalledWith('p1');
  });
});
