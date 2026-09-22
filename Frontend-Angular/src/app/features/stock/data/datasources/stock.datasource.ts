import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { Page } from '../../../../shared/utils/page';
import {
  BatchModel,
  StockDocumentModel,
  StockLevelModel,
  StockLocationModel,
  StockMovementModel,
  StockProductModel,
  StockUserModel,
} from '../models/stock.model';

@Injectable()
export class StockDataSource {
  private readonly http = inject(HttpClient);

  levels(params: Record<string, string>): Observable<Page<StockLevelModel>> {
    return this.http.get<Page<StockLevelModel>>(API_ROUTES.STOCK.LEVELS, { params });
  }
  movements(params: Record<string, string>): Observable<Page<StockMovementModel>> {
    return this.http.get<Page<StockMovementModel>>(API_ROUTES.STOCK.MOVEMENTS, { params });
  }
  batches(params: Record<string, string>): Observable<Page<BatchModel>> {
    return this.http.get<Page<BatchModel>>(API_ROUTES.BATCHES.ROOT, { params });
  }
  batch(id: string): Observable<BatchModel> {
    return this.http.get<BatchModel>(API_ROUTES.BATCHES.ONE(id));
  }
  documents(params: Record<string, string>): Observable<Page<StockDocumentModel>> {
    return this.http.get<Page<StockDocumentModel>>(API_ROUTES.STOCK.DOCUMENTS, { params });
  }
  document(id: string): Observable<StockDocumentModel> {
    return this.http.get<StockDocumentModel>(API_ROUTES.STOCK.DOCUMENT(id));
  }

  enter(body: unknown): Observable<StockDocumentModel> {
    return this.http.post<StockDocumentModel>(API_ROUTES.STOCK.ENTRIES, body);
  }
  exit(body: unknown): Observable<StockDocumentModel> {
    return this.http.post<StockDocumentModel>(API_ROUTES.STOCK.EXITS, body);
  }
  adjust(body: unknown): Observable<StockDocumentModel> {
    return this.http.post<StockDocumentModel>(API_ROUTES.STOCK.ADJUSTMENTS, body);
  }
  transfer(body: unknown): Observable<StockDocumentModel> {
    return this.http.post<StockDocumentModel>(API_ROUTES.STOCK.TRANSFERS, body);
  }

  products(params: Record<string, string>): Observable<Page<StockProductModel>> {
    return this.http.get<Page<StockProductModel>>(API_ROUTES.PRODUCTS.ROOT, { params });
  }
  product(id: string): Observable<StockProductModel> {
    return this.http.get<StockProductModel>(API_ROUTES.PRODUCTS.ONE(id));
  }
  locations(): Observable<StockLocationModel[]> {
    return this.http.get<StockLocationModel[]>(API_ROUTES.LOCATIONS.ROOT, {
      params: { includeInactive: 'true' },
    });
  }
  users(): Observable<Page<StockUserModel>> {
    return this.http.get<Page<StockUserModel>>(API_ROUTES.USERS.ROOT, {
      params: { page: '0', size: '100', sort: 'lastName,asc' },
    });
  }
}
