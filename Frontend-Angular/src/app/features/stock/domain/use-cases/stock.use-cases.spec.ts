import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { StockDocumentSummary, StockProduct } from '../entities/stock';
import { StockRepository } from '../repositories/stock.repository';
import {
  SearchBatchesUseCase,
  SearchMovementsUseCase,
  SearchStockLevelsUseCase,
  StockOperationsUseCase,
  dayRange,
} from './stock.use-cases';

const summary: StockDocumentSummary = {
  id: 'd1',
  type: 'ENTRY',
  number: 'BE-2026-000001',
  locationId: 'a',
  destinationLocationId: null,
  reference: null,
  reason: null,
  performedBy: 'u',
  performedByName: 'Aline Admin',
  createdAt: new Date(),
};

describe('stock use cases', () => {
  let repository: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = {
      enter: vi.fn().mockReturnValue(of(summary)),
      exit: vi.fn().mockReturnValue(of(summary)),
      transfer: vi.fn().mockReturnValue(of(summary)),
      document: vi.fn().mockReturnValue(of({ ...summary, lines: [{ id: 'm1' }] })),
      level: vi.fn(),
      movements: vi.fn().mockReturnValue(of({ content: [] })),
      batches: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        StockOperationsUseCase,
        SearchStockLevelsUseCase,
        SearchMovementsUseCase,
        SearchBatchesUseCase,
        { provide: StockRepository, useValue: repository },
      ],
    });
  });

  it('turns calendar days into instants of the company time zone', () => {
    expect(dayRange('2026-09-22', '2026-09-22', 'Africa/Douala')).toEqual({
      from: '2026-09-21T23:00:00.000Z',
      to: '2026-09-22T22:59:59.999Z',
    });
    expect(dayRange(null, null, 'UTC')).toEqual({ from: null, to: null });
  });

  it('returns the created note with its lines', async () => {
    const document = await firstValueFrom(
      TestBed.inject(StockOperationsUseCase).exit({
        locationId: 'a',
        productId: 'p',
        quantity: 1,
        reason: '',
        reference: '',
      }),
    );
    expect(repository['document']).toHaveBeenCalledWith('d1');
    expect(document.lines).toHaveLength(1);
  });

  it('still reports success when the note cannot be reloaded', async () => {
    repository['document'].mockReturnValue(throwError(() => new Error('offline')));
    const document = await firstValueFrom(
      TestBed.inject(StockOperationsUseCase).exit({
        locationId: 'a',
        productId: 'p',
        quantity: 1,
        reason: '',
        reference: '',
      }),
    );
    expect(document).toMatchObject({ number: 'BE-2026-000001', lines: [] });
  });

  it('normalizes batch numbers like the backend', () => {
    TestBed.inject(StockOperationsUseCase)
      .enter({
        locationId: 'a',
        productId: 'p',
        quantity: 3,
        reason: '',
        reference: '',
        batch: { batchNumber: ' lot-a ', manufacturingDate: null, expirationDate: '2026-12-31' },
      })
      .subscribe();
    expect(repository['enter'].mock.calls[0][0].batch.batchNumber).toBe('LOT-A');
  });

  it('refuses a transfer to the same location without calling the backend', async () => {
    const transfer = firstValueFrom(
      TestBed.inject(StockOperationsUseCase).transfer({
        sourceLocationId: 'a',
        destinationLocationId: 'a',
        productId: 'p',
        quantity: 1,
        reason: '',
        reference: '',
      }),
    );
    await expect(transfer).rejects.toMatchObject({ code: 'INVALID_TRANSFER' });
    expect(repository['transfer']).not.toHaveBeenCalled();
  });

  it('reads zero for a product never stored in a location', async () => {
    repository['level'].mockReturnValue(of(null));
    expect(await firstValueFrom(TestBed.inject(SearchStockLevelsUseCase).quantity('p', 'a'))).toBe(
      0,
    );
  });

  it('upper-cases the note number searched in movements', () => {
    TestBed.inject(SearchMovementsUseCase)
      .execute(
        { page: 0, size: 20 },
        {
          locationId: null,
          productId: null,
          type: null,
          performedBy: null,
          reference: ' be-2026-000001 ',
          dateFrom: null,
          dateTo: null,
        },
        'UTC',
      )
      .subscribe();
    expect(repository['movements'].mock.calls[0][1].reference).toBe('BE-2026-000001');
  });

  it('offers only batches still holding stock for an adjustment', async () => {
    const product = { id: 'p' } as StockProduct;
    repository['batches'].mockReturnValue(
      of({
        content: [
          { id: 'b1', status: 'ACTIVE' },
          { id: 'b2', status: 'DEPLETED' },
        ],
      }),
    );
    const batches = await firstValueFrom(
      TestBed.inject(SearchBatchesUseCase).available(product.id, 'a'),
    );
    expect(batches.map((b) => b.id)).toEqual(['b1']);
  });
});
