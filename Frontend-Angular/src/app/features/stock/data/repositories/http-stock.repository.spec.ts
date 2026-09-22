import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { AppError } from '../../../../core/errors/app-error';
import { EMPTY_LEVEL_FILTERS, EMPTY_MOVEMENT_FILTERS } from '../../domain/entities/stock';
import { StockDataSource } from '../datasources/stock.datasource';
import { HttpStockRepository } from './http-stock.repository';

const EMPTY_PAGE = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };

describe('HttpStockRepository', () => {
  let repository: HttpStockRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        StockDataSource,
        HttpStockRepository,
      ],
    });
    repository = TestBed.inject(HttpStockRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the level state filter to lowStock / outOfStock', () => {
    repository.levels({ page: 0, size: 20 }, { ...EMPTY_LEVEL_FILTERS, state: 'LOW' }).subscribe();
    const low = http.expectOne((r) => r.url === API_ROUTES.STOCK.LEVELS);
    expect(low.request.params.get('lowStock')).toBe('true');
    expect(low.request.params.has('outOfStock')).toBe(false);
    low.flush(EMPTY_PAGE);

    repository
      .levels(
        { page: 1, size: 50, sort: { field: 'quantity', direction: 'asc' } },
        { search: 'riz', locationId: 'a', state: 'OUT' },
      )
      .subscribe();
    const out = http.expectOne((r) => r.url === API_ROUTES.STOCK.LEVELS);
    expect(out.request.params.keys().sort()).toEqual([
      'locationId',
      'outOfStock',
      'page',
      'search',
      'size',
      'sort',
    ]);
    expect(out.request.params.get('sort')).toBe('quantity,asc');
    out.flush(EMPTY_PAGE);
  });

  it('returns null when a product was never stored in a location', async () => {
    const level = firstValueFrom(repository.level('p1', 'a'));
    const request = http.expectOne((r) => r.url === API_ROUTES.STOCK.LEVELS);
    expect(request.request.params.get('productId')).toBe('p1');
    expect(request.request.params.get('locationId')).toBe('a');
    request.flush(EMPTY_PAGE);
    expect(await level).toBeNull();
  });

  it('sends movement filters with instant bounds', () => {
    repository
      .movements(
        { page: 0, size: 20 },
        { ...EMPTY_MOVEMENT_FILTERS, type: 'ENTRY', reference: 'BE-2026-000001' },
        { from: '2026-09-21T23:00:00.000Z', to: null },
      )
      .subscribe();
    const request = http.expectOne((r) => r.url === API_ROUTES.STOCK.MOVEMENTS);
    expect(request.request.params.get('type')).toBe('ENTRY');
    expect(request.request.params.get('reference')).toBe('BE-2026-000001');
    expect(request.request.params.get('dateFrom')).toBe('2026-09-21T23:00:00.000Z');
    expect(request.request.params.has('dateTo')).toBe(false);
    request.flush(EMPTY_PAGE);
  });

  it('posts a transfer and returns the created note', async () => {
    const created = firstValueFrom(
      repository.transfer({
        sourceLocationId: 'a',
        destinationLocationId: 'b',
        productId: 'p1',
        quantity: 7,
        reason: '',
        reference: '',
      }),
    );
    const request = http.expectOne(API_ROUTES.STOCK.TRANSFERS);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      sourceLocationId: 'a',
      destinationLocationId: 'b',
    });
    request.flush({
      id: 'd1',
      type: 'TRANSFER',
      number: 'TR-2026-000001',
      locationId: 'a',
      destinationLocationId: 'b',
      reference: null,
      reason: null,
      performedBy: 'u',
      performedByName: 'Aline Admin',
      createdAt: '2026-09-22T10:00:00Z',
      companyId: 'c',
    });
    expect((await created).number).toBe('TR-2026-000001');
  });

  it('turns an insufficient stock refusal into a business AppError', async () => {
    const exit = firstValueFrom(
      repository.exit({
        locationId: 'a',
        productId: 'p1',
        quantity: 99,
        reason: '',
        reference: '',
      }),
    );
    http
      .expectOne(API_ROUTES.STOCK.EXITS)
      .flush(
        { code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    await expect(exit).rejects.toMatchObject({
      kind: 'business',
      code: 'INSUFFICIENT_STOCK',
    } satisfies Partial<AppError>);
  });

  it('searches only active products for the pickers', () => {
    repository.searchProducts('riz').subscribe();
    const request = http.expectOne((r) => r.url === API_ROUTES.PRODUCTS.ROOT);
    expect(request.request.params.get('q')).toBe('riz');
    expect(request.request.params.get('active')).toBe('true');
    request.flush(EMPTY_PAGE);
  });
});
