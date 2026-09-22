import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { AppError } from '../../../../core/errors/app-error';
import { EMPTY_PRODUCT_FILTERS } from '../../domain/entities/product';
import { ProductsDataSource } from '../datasources/products.datasource';
import { HttpProductsRepository } from './http-products.repository';

describe('HttpProductsRepository', () => {
  let repository: HttpProductsRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductsDataSource,
        HttpProductsRepository,
      ],
    });
    repository = TestBed.inject(HttpProductsRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends only the filters that are set', () => {
    repository
      .search(
        { page: 1, size: 20, sort: { field: 'name', direction: 'asc' } },
        { ...EMPTY_PRODUCT_FILTERS, text: 'riz', active: false },
      )
      .subscribe();
    const request = http.expectOne((r) => r.url === API_ROUTES.PRODUCTS.ROOT);
    expect(request.request.params.keys().sort()).toEqual(['active', 'page', 'q', 'size', 'sort']);
    expect(request.request.params.get('active')).toBe('false');
    request.flush({ content: [], page: 1, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('wraps updates with the version for optimistic locking', () => {
    repository
      .update(
        'p1',
        {
          sku: '',
          barcode: '',
          barcodeFormat: null,
          name: 'A',
          description: '',
          categoryId: null,
          defaultSupplierId: null,
          unit: 'UNIT',
          purchasePrice: 0,
          salePrice: 0,
          minStock: 0,
          reorderQuantity: null,
          batchTracked: false,
          expiryTracked: false,
        },
        4,
      )
      .subscribe();
    const request = http.expectOne(API_ROUTES.PRODUCTS.ONE('p1'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({ version: 4, product: { name: 'A', sku: null } });
    request.flush({});
  });

  it('uploads the picture as multipart and always revalidates it when reading', () => {
    repository.uploadImage('p1', new File(['x'], 'a.png', { type: 'image/png' })).subscribe();
    const upload = http.expectOne(API_ROUTES.PRODUCTS.IMAGE('p1'));
    expect(upload.request.method).toBe('PUT');
    expect((upload.request.body as FormData).get('file')).toBeInstanceOf(File);
    upload.flush(null);

    repository.image('p1').subscribe();
    const read = http.expectOne(API_ROUTES.PRODUCTS.IMAGE('p1'));
    expect(read.request.cache).toBe('no-cache');
    read.flush(new Blob(['x']));
  });

  it('keeps the backend code of a failed file download', async () => {
    const result = firstValueFrom(repository.image('p1')).catch((e: AppError) => e);
    http.expectOne(API_ROUTES.PRODUCTS.IMAGE('p1')).flush(
      new Blob([JSON.stringify({ code: 'PRODUCT_NOT_FOUND', message: 'nope' })], {
        type: 'application/json',
      }),
      { status: 404, statusText: 'Not Found' },
    );
    const error = (await result) as AppError;
    expect(error.code).toBe('PRODUCT_NOT_FOUND');
    expect(error.kind).toBe('not-found');
  });
});
