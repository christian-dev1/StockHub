import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { Page } from '../../../../shared/utils/page';
import { SupplierModel } from '../models/supplier.model';

@Injectable()
export class SuppliersDataSource {
  private readonly http = inject(HttpClient);

  search(params: Record<string, string>): Observable<Page<SupplierModel>> {
    return this.http.get<Page<SupplierModel>>(API_ROUTES.SUPPLIERS.ROOT, { params });
  }
  get(id: string): Observable<SupplierModel> {
    return this.http.get<SupplierModel>(API_ROUTES.SUPPLIERS.ONE(id));
  }
  create(body: unknown): Observable<SupplierModel> {
    return this.http.post<SupplierModel>(API_ROUTES.SUPPLIERS.ROOT, body);
  }
  update(id: string, body: unknown): Observable<SupplierModel> {
    return this.http.put<SupplierModel>(API_ROUTES.SUPPLIERS.ONE(id), body);
  }
  activate(id: string): Observable<SupplierModel> {
    return this.http.post<SupplierModel>(API_ROUTES.SUPPLIERS.ACTIVATE(id), null);
  }
  deactivate(id: string): Observable<SupplierModel> {
    return this.http.post<SupplierModel>(API_ROUTES.SUPPLIERS.DEACTIVATE(id), null);
  }
}
