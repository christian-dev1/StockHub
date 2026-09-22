import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { CategoryModel } from '../models/category.model';

@Injectable()
export class CategoriesDataSource {
  private readonly http = inject(HttpClient);

  list(text: string): Observable<CategoryModel[]> {
    const params: Record<string, string> = text ? { q: text } : {};
    return this.http.get<CategoryModel[]>(API_ROUTES.CATEGORIES.ROOT, { params });
  }
  create(body: unknown): Observable<CategoryModel> {
    return this.http.post<CategoryModel>(API_ROUTES.CATEGORIES.ROOT, body);
  }
  update(id: string, body: unknown): Observable<CategoryModel> {
    return this.http.put<CategoryModel>(API_ROUTES.CATEGORIES.ONE(id), body);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(API_ROUTES.CATEGORIES.ONE(id));
  }
}
