import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { Page } from '../../../../shared/utils/page';
import {
  CategoryOptionModel,
  ImportPreviewModel,
  ImportResultModel,
  ProductModel,
  SupplierOptionModel,
} from '../models/product.model';

@Injectable()
export class ProductsDataSource {
  private readonly http = inject(HttpClient);

  search(params: Record<string, string>): Observable<Page<ProductModel>> {
    return this.http.get<Page<ProductModel>>(API_ROUTES.PRODUCTS.ROOT, { params });
  }
  get(id: string): Observable<ProductModel> {
    return this.http.get<ProductModel>(API_ROUTES.PRODUCTS.ONE(id));
  }
  create(body: unknown): Observable<ProductModel> {
    return this.http.post<ProductModel>(API_ROUTES.PRODUCTS.ROOT, body);
  }
  update(id: string, body: unknown): Observable<ProductModel> {
    return this.http.put<ProductModel>(API_ROUTES.PRODUCTS.ONE(id), body);
  }
  activate(id: string): Observable<ProductModel> {
    return this.http.post<ProductModel>(API_ROUTES.PRODUCTS.ACTIVATE(id), null);
  }
  deactivate(id: string): Observable<ProductModel> {
    return this.http.post<ProductModel>(API_ROUTES.PRODUCTS.DEACTIVATE(id), null);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(API_ROUTES.PRODUCTS.ONE(id));
  }

  image(id: string): Observable<Blob> {
    return this.http.get(API_ROUTES.PRODUCTS.IMAGE(id), {
      responseType: 'blob',
      cache: 'no-cache',
    });
  }
  uploadImage(id: string, file: File): Observable<void> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.put<void>(API_ROUTES.PRODUCTS.IMAGE(id), body);
  }
  deleteImage(id: string): Observable<void> {
    return this.http.delete<void>(API_ROUTES.PRODUCTS.IMAGE(id));
  }

  categories(): Observable<CategoryOptionModel[]> {
    return this.http.get<CategoryOptionModel[]>(API_ROUTES.CATEGORIES.ROOT);
  }
  activeSuppliers(): Observable<Page<SupplierOptionModel>> {
    return this.http.get<Page<SupplierOptionModel>>(API_ROUTES.SUPPLIERS.ROOT, {
      params: { active: 'true', size: '100', sort: 'name,asc' },
    });
  }

  importTemplate(): Observable<Blob> {
    return this.http.get(API_ROUTES.PRODUCTS.IMPORT_TEMPLATE, { responseType: 'blob' });
  }
  previewImport(file: File, createMissingCategories: boolean): Observable<ImportPreviewModel> {
    const body = new FormData();
    body.append('file', file, file.name);
    body.append('createMissingCategories', String(createMissingCategories));
    return this.http.post<ImportPreviewModel>(API_ROUTES.PRODUCTS.IMPORT_PREVIEW, body);
  }
  commitImport(jobId: string): Observable<ImportResultModel> {
    return this.http.post<ImportResultModel>(API_ROUTES.PRODUCTS.IMPORT_COMMIT(jobId), null);
  }
}
