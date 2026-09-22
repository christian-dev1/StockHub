import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { AppError } from '../../../../core/errors/app-error';
import { BarcodesDataSource } from '../datasources/barcodes.datasource';
import { HttpBarcodesRepository } from './http-barcodes.repository';

describe('HttpBarcodesRepository', () => {
  let repository: HttpBarcodesRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BarcodesDataSource,
        HttpBarcodesRepository,
      ],
    });
    repository = TestBed.inject(HttpBarcodesRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for replacement explicitly and maps the generated barcode', async () => {
    const result = firstValueFrom(repository.generate('p1', 'EAN13', false));
    const request = http.expectOne(API_ROUTES.BARCODES.GENERATE('p1'));
    expect(request.request.body).toEqual({ format: 'EAN13', replaceExisting: false });
    request.flush({ barcode: '2000000000015', barcodeFormat: 'EAN13' });
    expect(await result).toEqual({ barcode: '2000000000015', format: 'EAN13' });
  });

  it('turns a failed label run back into the backend error', async () => {
    const result = firstValueFrom(
      repository.labels({
        items: [{ productId: 'p', copies: 1 }],
        layout: 'A4_3X8',
        showPrice: false,
        startPosition: 0,
      }),
    ).catch((e: AppError) => e);
    const request = http.expectOne(API_ROUTES.BARCODES.LABELS);
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob([JSON.stringify({ code: 'BARCODE_MISSING', message: 'm' })]), {
      status: 422,
      statusText: 'Unprocessable',
    });
    expect(((await result) as AppError).code).toBe('BARCODE_MISSING');
  });

  it('looks for active products that have a barcode', () => {
    repository.searchLabelProducts('riz').subscribe();
    const request = http.expectOne((r) => r.url === API_ROUTES.PRODUCTS.ROOT);
    expect(request.request.params.get('hasBarcode')).toBe('true');
    expect(request.request.params.get('active')).toBe('true');
    expect(request.request.params.get('q')).toBe('riz');
    request.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });
});
