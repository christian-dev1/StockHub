import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, of, switchMap } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { toAppError } from '../../../../shared/utils/resource-state';
import { Batch, StockDocument } from '../../domain/entities/stock';
import {
  SearchBatchesUseCase,
  SearchStockLevelsUseCase,
} from '../../domain/use-cases/stock.use-cases';

interface Place {
  readonly productId: string;
  readonly locationId: string;
}

/**
 * State of an operation screen: the stock available where the goods are
 * taken from, the batches of that place (for adjustments), the submission and
 * its result. Availability requests are switchMapped so that a quick change of
 * product or location never shows a stale quantity.
 */
@Injectable()
export class StockOperationStore {
  private readonly levels = inject(SearchStockLevelsUseCase);
  private readonly batchQueries = inject(SearchBatchesUseCase);
  private readonly destroyRef = inject(DestroyRef);

  /** Quantity at the source; null while unknown (nothing selected, loading or failed). */
  readonly available = signal<number | null>(null);
  readonly availableLoading = signal(false);
  /** Quantity at the destination of a transfer. */
  readonly destinationQuantity = signal<number | null>(null);
  readonly batches = signal<Batch[]>([]);
  readonly batchesLoading = signal(false);

  readonly submitting = signal(false);
  readonly error = signal<AppError | null>(null);
  readonly result = signal<StockDocument | null>(null);
  readonly done = computed(() => this.result() !== null);

  private readonly availability = new Subject<Place | null>();
  private readonly destination = new Subject<Place | null>();
  private readonly batchRequests = new Subject<Place | null>();

  constructor() {
    this.availability
      .pipe(
        switchMap((place) => this.quantityOf(place, this.availableLoading)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((quantity) => {
        this.availableLoading.set(false);
        this.available.set(quantity);
      });
    this.destination
      .pipe(
        switchMap((place) => this.quantityOf(place)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((quantity) => this.destinationQuantity.set(quantity));
    this.batchRequests
      .pipe(
        switchMap((place) => {
          if (!place) return of<Batch[]>([]);
          this.batchesLoading.set(true);
          return this.batchQueries
            .available(place.productId, place.locationId)
            .pipe(catchError(() => of<Batch[]>([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((batches) => {
        this.batchesLoading.set(false);
        this.batches.set(batches);
      });
  }

  refreshAvailability(productId: string | null, locationId: string | null): void {
    this.available.set(null);
    this.availability.next(productId && locationId ? { productId, locationId } : null);
  }

  refreshDestination(productId: string | null, locationId: string | null): void {
    this.destinationQuantity.set(null);
    this.destination.next(productId && locationId ? { productId, locationId } : null);
  }

  refreshBatches(productId: string | null, locationId: string | null): void {
    this.batches.set([]);
    this.batchRequests.next(productId && locationId ? { productId, locationId } : null);
  }

  submit(
    operation: Observable<StockDocument>,
    done: (document: StockDocument) => void,
    failed: () => void = () => undefined,
  ): void {
    this.submitting.set(true);
    this.error.set(null);
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (document) => {
        this.submitting.set(false);
        this.result.set(document);
        done(document);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.error.set(toAppError(error));
        failed();
      },
    });
  }

  /** Back to an empty form for the next operation. */
  reset(): void {
    this.result.set(null);
    this.error.set(null);
  }

  clearError(): void {
    this.error.set(null);
  }

  private quantityOf(
    place: Place | null,
    loading?: { set: (value: boolean) => void },
  ): Observable<number | null> {
    if (!place) return of(null);
    loading?.set(true);
    return this.levels
      .quantity(place.productId, place.locationId)
      .pipe(catchError(() => of<number | null>(null)));
  }
}
