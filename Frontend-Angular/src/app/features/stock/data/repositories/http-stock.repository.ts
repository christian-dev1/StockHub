import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors } from '../../../../core/errors/with-app-errors';
import { Page, PageRequest, mapPage, toQueryParams } from '../../../../shared/utils/page';
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
} from '../../domain/entities/stock';
import { InstantRange, StockRepository } from '../../domain/repositories/stock.repository';
import { StockDataSource } from '../datasources/stock.datasource';
import {
  toAdjustmentRequest,
  toBatch,
  toEntryRequest,
  toExitRequest,
  toStockDocument,
  toStockDocumentSummary,
  toStockLevel,
  toStockLocation,
  toStockMovement,
  toStockProduct,
  toStockUser,
  toTransferRequest,
} from '../mappers/stock.mapper';

@Injectable()
export class HttpStockRepository extends StockRepository {
  private readonly source = inject(StockDataSource);

  levels(request: PageRequest, filters: LevelFilters): Observable<Page<StockLevel>> {
    return this.source
      .levels(
        toQueryParams(request, {
          search: filters.search,
          locationId: filters.locationId,
          lowStock: filters.state === 'LOW' ? true : null,
          outOfStock: filters.state === 'OUT' ? true : null,
        }),
      )
      .pipe(
        map((page) => mapPage(page, toStockLevel)),
        withAppErrors(),
      );
  }

  level(productId: string, locationId: string): Observable<StockLevel | null> {
    return this.source.levels(toQueryParams({ page: 0, size: 1 }, { productId, locationId })).pipe(
      map((page) => (page.content.length ? toStockLevel(page.content[0]) : null)),
      withAppErrors(),
    );
  }

  movements(
    request: PageRequest,
    filters: MovementFilters,
    range: InstantRange,
  ): Observable<Page<StockMovement>> {
    return this.source
      .movements(
        toQueryParams(request, {
          locationId: filters.locationId,
          productId: filters.productId,
          type: filters.type,
          performedBy: filters.performedBy,
          reference: filters.reference,
          dateFrom: range.from,
          dateTo: range.to,
        }),
      )
      .pipe(
        map((page) => mapPage(page, toStockMovement)),
        withAppErrors(),
      );
  }

  batches(request: PageRequest, filters: BatchFilters): Observable<Page<Batch>> {
    return this.source
      .batches(
        toQueryParams(request, {
          batchNumber: filters.batchNumber,
          productId: filters.productId,
          locationId: filters.locationId,
          status: filters.status,
          expirationFrom: filters.expirationFrom,
          expirationTo: filters.expirationTo,
        }),
      )
      .pipe(
        map((page) => mapPage(page, toBatch)),
        withAppErrors(),
      );
  }

  batch(id: string): Observable<Batch> {
    return this.source.batch(id).pipe(map(toBatch), withAppErrors());
  }

  documents(
    request: PageRequest,
    filters: DocumentFilters,
    range: InstantRange,
  ): Observable<Page<StockDocumentSummary>> {
    return this.source
      .documents(
        toQueryParams(request, {
          type: filters.type,
          locationId: filters.locationId,
          reference: filters.reference,
          dateFrom: range.from,
          dateTo: range.to,
        }),
      )
      .pipe(
        map((page) => mapPage(page, toStockDocumentSummary)),
        withAppErrors(),
      );
  }

  document(id: string): Observable<StockDocument> {
    return this.source.document(id).pipe(map(toStockDocument), withAppErrors());
  }

  enter(command: EntryCommand): Observable<StockDocumentSummary> {
    return this.source
      .enter(toEntryRequest(command))
      .pipe(map(toStockDocumentSummary), withAppErrors());
  }

  exit(command: ExitCommand): Observable<StockDocumentSummary> {
    return this.source
      .exit(toExitRequest(command))
      .pipe(map(toStockDocumentSummary), withAppErrors());
  }

  adjust(command: AdjustmentCommand): Observable<StockDocumentSummary> {
    return this.source
      .adjust(toAdjustmentRequest(command))
      .pipe(map(toStockDocumentSummary), withAppErrors());
  }

  transfer(command: TransferCommand): Observable<StockDocumentSummary> {
    return this.source
      .transfer(toTransferRequest(command))
      .pipe(map(toStockDocumentSummary), withAppErrors());
  }

  searchProducts(term: string): Observable<StockProduct[]> {
    return this.source
      .products(toQueryParams({ page: 0, size: 20 }, { q: term, active: true }))
      .pipe(
        map((page) => page.content.map(toStockProduct)),
        withAppErrors(),
      );
  }

  product(id: string): Observable<StockProduct> {
    return this.source.product(id).pipe(map(toStockProduct), withAppErrors());
  }

  locations(): Observable<StockLocation[]> {
    return this.source.locations().pipe(
      map((locations) => locations.map(toStockLocation)),
      withAppErrors(),
    );
  }

  users(): Observable<StockUser[]> {
    return this.source.users().pipe(
      map((page) => page.content.map(toStockUser)),
      withAppErrors(),
    );
  }
}
