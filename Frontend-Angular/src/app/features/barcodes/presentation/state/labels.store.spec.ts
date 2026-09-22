import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LabelProduct } from '../../domain/entities/barcode';
import { PrintLabelsUseCase } from '../../domain/use-cases/barcode.use-cases';
import { LabelsStore } from './labels.store';

const product = (id: string, barcode: string | null = '2000000000015'): LabelProduct => ({
  id,
  name: id,
  sku: id,
  barcode,
  salePrice: 100,
});

describe('LabelsStore', () => {
  let useCase: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    useCase = {
      search: vi.fn().mockReturnValue(of([])),
      products: vi.fn().mockReturnValue(of([product('a'), product('b', null)])),
      execute: vi.fn().mockReturnValue(of(new Blob(['%PDF']))),
    };
    TestBed.configureTestingModule({
      providers: [LabelsStore, { provide: PrintLabelsUseCase, useValue: useCase }],
    });
  });

  it('computes labels and pages, including a partly used sheet', () => {
    const store = TestBed.inject(LabelsStore);
    store.add(product('a'));
    store.add(product('a'));
    store.setCopies('a', 24);
    expect(store.selection().length).toBe(1);
    expect(store.pages()).toBe(1);
    store.startPosition.set(2);
    expect(store.pages()).toBe(2);
  });

  it('preselects only products that have a barcode', () => {
    const store = TestBed.inject(LabelsStore);
    store.preselect(['a', 'b']);
    expect(store.selection().map((s) => s.product.id)).toEqual(['a']);
  });

  it('sends a 0-based start position and refuses invalid runs', () => {
    const store = TestBed.inject(LabelsStore);
    expect(store.generate()).toBeNull();
    store.add(product('a'));
    store.startPosition.set(3);
    store.generate()?.subscribe();
    expect(useCase['execute']).toHaveBeenCalledWith(
      expect.objectContaining({ startPosition: 2, items: [{ productId: 'a', copies: 1 }] }),
    );
  });
});
