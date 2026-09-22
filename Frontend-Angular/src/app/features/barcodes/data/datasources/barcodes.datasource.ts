import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { Page } from '../../../../shared/utils/page';
import { GeneratedBarcodeModel, LabelProductModel } from '../models/barcode.model';

@Injectable()
export class BarcodesDataSource {
  private readonly http = inject(HttpClient);

  generate(productId: string, body: unknown): Observable<GeneratedBarcodeModel> {
    return this.http.post<GeneratedBarcodeModel>(API_ROUTES.BARCODES.GENERATE(productId), body);
  }
  /** The barcode changes when regenerated: always ask the server. */
  png(productId: string): Observable<Blob> {
    return this.http.get(API_ROUTES.BARCODES.PNG(productId), {
      params: { width: '600', height: '180' },
      responseType: 'blob',
      cache: 'no-cache',
    });
  }
  svg(productId: string): Observable<Blob> {
    return this.http.get(API_ROUTES.BARCODES.SVG(productId), {
      responseType: 'blob',
      cache: 'no-cache',
    });
  }
  labels(body: unknown): Observable<Blob> {
    return this.http.post(API_ROUTES.BARCODES.LABELS, body, { responseType: 'blob' });
  }
  searchProducts(text: string): Observable<Page<LabelProductModel>> {
    const params: Record<string, string> = {
      hasBarcode: 'true',
      active: 'true',
      size: '20',
      sort: 'name,asc',
    };
    if (text) params['q'] = text;
    return this.http.get<Page<LabelProductModel>>(API_ROUTES.PRODUCTS.ROOT, { params });
  }
  product(id: string): Observable<LabelProductModel> {
    return this.http.get<LabelProductModel>(API_ROUTES.PRODUCTS.ONE(id));
  }
}
