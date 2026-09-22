import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors } from '../../../../core/errors/with-app-errors';
import { Category, CategoryDraft } from '../../domain/entities/category';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';
import { CategoriesDataSource } from '../datasources/categories.datasource';
import { toCategory } from '../mappers/category.mapper';

@Injectable()
export class HttpCategoriesRepository extends CategoriesRepository {
  private readonly source = inject(CategoriesDataSource);

  list(text: string): Observable<Category[]> {
    return this.source.list(text).pipe(
      map((categories) => categories.map(toCategory)),
      withAppErrors(),
    );
  }
  create(draft: CategoryDraft): Observable<Category> {
    return this.source.create(draft).pipe(map(toCategory), withAppErrors());
  }
  update(id: string, draft: CategoryDraft, version: number): Observable<Category> {
    return this.source
      .update(id, { category: draft, version })
      .pipe(map(toCategory), withAppErrors());
  }
  delete(id: string): Observable<void> {
    return this.source.delete(id).pipe(withAppErrors());
  }
}
