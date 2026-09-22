import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { Page, PageRequest } from '../../../../shared/utils/page';
import { endOfZonedDay, startOfZonedDay } from '../../../../shared/utils/zoned-day';
import {
  AdjustmentCommand,
  Batch,
  BatchFilters,
  DocumentFilters,
  EntryCommand,
  ExitCommand,
  LevelFilters,
  MovementFilters,
  StockDocument,
  StockDocumentSummary,
  StockLevel,
  StockLocation,
  StockMovement,
  StockProduct,
  StockUser,
  TransferCommand,
} from '../entities/stock';
import { InstantRange, StockRepository } from '../repositories/stock.repository';

/** Turns calendar days of the company into the instant bounds the backend expects. */
export function dayRange(from: string | null, to: string | null, zone: string): InstantRange {
  return {
    from: from ? startOfZonedDay(from, zone).toISOString() : null,
    to: to ? endOfZonedDay(to, zone).toISOString() : null,
  };
}

@Injectable()
export class SearchStockLevelsUseCase {
  private readonly repository = inject(StockRepository);
  execute(request: PageRequest, filters: LevelFilters): Observable<Page<StockLevel>> {
    return this.repository.levels(request, { ...filters, search: filters.search.trim() });
  }
  /** Current quantity of a product in a location; zero when it was never stored there. */
  quantity(productId: string, locationId: string): Observable<number> {
    return this.repository.level(productId, locationId).pipe(map((level) => level?.quantity ?? 0));
  }
}

@Injectable()
export class SearchMovementsUseCase {
  private readonly repository = inject(StockRepository);
  execute(
    request: PageRequest,
    filters: MovementFilters,
    zone: string,
  ): Observable<Page<StockMovement>> {
    return this.repository.movements(
      request,
      { ...filters, reference: filters.reference.trim().toUpperCase() },
      dayRange(filters.dateFrom, filters.dateTo, zone),
    );
  }
}

@Injectable()
export class SearchBatchesUseCase {
  private readonly repository = inject(StockRepository);
  /** Batch numbers are stored trimmed and upper-cased: the filter matches them exactly. */
  execute(request: PageRequest, filters: BatchFilters): Observable<Page<Batch>> {
    return this.repository.batches(request, {
      ...filters,
      batchNumber: filters.batchNumber.trim().toUpperCase(),
    });
  }
  /** Batches still holding stock for an adjustment, most urgent expiry first. */
  available(productId: string, locationId: string): Observable<Batch[]> {
    return this.repository
      .batches(
        { page: 0, size: 100, sort: { field: 'expirationDate', direction: 'asc' } },
        {
          batchNumber: '',
          productId,
          locationId,
          status: null,
          expirationFrom: null,
          expirationTo: null,
        },
      )
      .pipe(map((page) => page.content.filter((batch) => batch.status === 'ACTIVE')));
  }
  get(id: string): Observable<Batch> {
    return this.repository.batch(id);
  }
}

@Injectable()
export class StockDocumentsUseCase {
  private readonly repository = inject(StockRepository);
  search(
    request: PageRequest,
    filters: DocumentFilters,
    zone: string,
  ): Observable<Page<StockDocumentSummary>> {
    return this.repository.documents(
      request,
      { ...filters, reference: filters.reference.trim() },
      dayRange(filters.dateFrom, filters.dateTo, zone),
    );
  }
  get(id: string): Observable<StockDocument> {
    return this.repository.document(id);
  }
}

const SAME_LOCATION: AppError = {
  kind: 'business',
  status: 422,
  code: 'INVALID_TRANSFER',
  message: '',
  fieldErrors: [],
};

/**
 * Stock operations. Each returns the created stock note with its lines, so
 * that the user sees the batches the backend chose (FEFO) and the levels
 * before/after. If the note cannot be reloaded, the operation still succeeded:
 * its header is returned without lines.
 */
@Injectable()
export class StockOperationsUseCase {
  private readonly repository = inject(StockRepository);

  enter(command: EntryCommand): Observable<StockDocument> {
    const batch = command.batch && {
      ...command.batch,
      batchNumber: command.batch.batchNumber.trim().toUpperCase(),
    };
    return this.withLines(this.repository.enter({ ...command, batch }));
  }

  exit(command: ExitCommand): Observable<StockDocument> {
    return this.withLines(this.repository.exit(command));
  }

  adjust(command: AdjustmentCommand): Observable<StockDocument> {
    return this.withLines(this.repository.adjust(command));
  }

  transfer(command: TransferCommand): Observable<StockDocument> {
    if (command.sourceLocationId === command.destinationLocationId) {
      return throwError(() => SAME_LOCATION);
    }
    return this.withLines(this.repository.transfer(command));
  }

  private withLines(operation: Observable<StockDocumentSummary>): Observable<StockDocument> {
    return operation.pipe(
      switchMap((summary) =>
        this.repository
          .document(summary.id)
          .pipe(catchError(() => of<StockDocument>({ ...summary, lines: [] }))),
      ),
    );
  }
}

/** Catalogue, locations and users shown next to stock data (names instead of ids). */
@Injectable()
export class StockReferencesUseCase {
  private readonly repository = inject(StockRepository);
  searchProducts(term: string): Observable<StockProduct[]> {
    return this.repository.searchProducts(term.trim());
  }
  product(id: string): Observable<StockProduct> {
    return this.repository.product(id);
  }
  locations(): Observable<StockLocation[]> {
    return this.repository.locations();
  }
  users(): Observable<StockUser[]> {
    return this.repository.users();
  }
}
