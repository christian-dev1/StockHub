import { Observable } from 'rxjs';
import { Page, PageRequest } from '../../../../shared/utils/page';
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

/**
 * Date filters of movements and documents are instants: the use cases turn
 * the calendar days chosen by the user into bounds in the company time zone.
 */
export interface InstantRange {
  readonly from: string | null;
  readonly to: string | null;
}

export abstract class StockRepository {
  abstract levels(request: PageRequest, filters: LevelFilters): Observable<Page<StockLevel>>;
  /** Level of one product in one location, or null when nothing was ever stored there. */
  abstract level(productId: string, locationId: string): Observable<StockLevel | null>;
  abstract movements(
    request: PageRequest,
    filters: MovementFilters,
    range: InstantRange,
  ): Observable<Page<StockMovement>>;
  abstract batches(request: PageRequest, filters: BatchFilters): Observable<Page<Batch>>;
  abstract batch(id: string): Observable<Batch>;
  abstract documents(
    request: PageRequest,
    filters: DocumentFilters,
    range: InstantRange,
  ): Observable<Page<StockDocumentSummary>>;
  abstract document(id: string): Observable<StockDocument>;

  abstract enter(command: EntryCommand): Observable<StockDocumentSummary>;
  abstract exit(command: ExitCommand): Observable<StockDocumentSummary>;
  abstract adjust(command: AdjustmentCommand): Observable<StockDocumentSummary>;
  abstract transfer(command: TransferCommand): Observable<StockDocumentSummary>;

  /** Active products matching a name, SKU or barcode fragment (operation forms, filters). */
  abstract searchProducts(term: string): Observable<StockProduct[]>;
  abstract product(id: string): Observable<StockProduct>;
  /** Every location the user may see, inactive ones included when allowed (names of old movements). */
  abstract locations(): Observable<StockLocation[]>;
  /** Company users (requires USER_VIEW), to name the author of movements. */
  abstract users(): Observable<StockUser[]>;
}
