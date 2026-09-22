import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { ImportPreview } from '../../domain/entities/product-import';
import { ProductImportUseCase } from '../../domain/use-cases/product.use-cases';
import { ProductImportStore } from './product-import.store';

const preview = (errorCount: number): ImportPreview => ({
  jobId: 'j1',
  fileName: 'p.csv',
  totalRows: 2,
  createCount: 2 - errorCount,
  updateCount: 0,
  errorCount,
  categoriesToCreate: [],
  rows: [],
  expiresAt: new Date(Date.now() + 3_600_000),
});

describe('ProductImportStore', () => {
  let imports: { preview: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    imports = {
      preview: vi.fn(),
      commit: vi.fn().mockReturnValue(of({ created: 2, updated: 0, categoriesCreated: 0 })),
    };
    TestBed.configureTestingModule({
      providers: [ProductImportStore, { provide: ProductImportUseCase, useValue: imports }],
    });
  });

  const csv = new File(['sku,name'], 'p.csv', { type: 'text/csv' });

  it('refuses unsupported files before any upload', () => {
    const store = TestBed.inject(ProductImportStore);
    store.choose(new File(['x'], 'p.pdf'));
    expect(store.fileProblem()).toBe('type');
    expect(store.analyse()).toBeNull();
  });

  it('never commits a preview with errors', () => {
    imports.preview.mockReturnValue(of(preview(1)));
    const store = TestBed.inject(ProductImportStore);
    store.choose(csv);
    store.analyse()?.subscribe();
    expect(store.step()).toBe('preview');
    expect(store.committable()).toBe(false);
    expect(store.commit()).toBeNull();
    expect(imports.commit).not.toHaveBeenCalled();
  });

  it('commits a clean preview and shows the result', () => {
    imports.preview.mockReturnValue(of(preview(0)));
    const store = TestBed.inject(ProductImportStore);
    store.choose(csv);
    store.analyse()?.subscribe();
    store.commit()?.subscribe();
    expect(imports.commit).toHaveBeenCalledWith('j1');
    expect(store.step()).toBe('done');
    expect(store.result()?.created).toBe(2);
  });

  it('keeps the error of a rejected file on the first step', () => {
    const error: AppError = {
      kind: 'validation',
      status: 400,
      code: 'IMPORT_EMPTY',
      message: '',
      fieldErrors: [],
    };
    imports.preview.mockReturnValue(throwError(() => error));
    const store = TestBed.inject(ProductImportStore);
    store.choose(csv);
    store.analyse()?.subscribe({ error: () => undefined });
    expect(store.step()).toBe('file');
    expect(store.error()?.code).toBe('IMPORT_EMPTY');
  });
});
