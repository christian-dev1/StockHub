import { Observable } from 'rxjs';
import { Category, CategoryDraft } from '../entities/category';

export abstract class CategoriesRepository {
  abstract list(text: string): Observable<Category[]>;
  abstract create(draft: CategoryDraft): Observable<Category>;
  abstract update(id: string, draft: CategoryDraft, version: number): Observable<Category>;
  abstract delete(id: string): Observable<void>;
}
