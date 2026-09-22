import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { toAppError } from '../../../../shared/utils/resource-state';
import { Category, CategoryDraft } from '../../domain/entities/category';
import {
  DeleteCategoryUseCase,
  ListCategoriesUseCase,
  SaveCategoryUseCase,
} from '../../domain/use-cases/category.use-cases';

/**
 * The whole category tree (a few dozen entries at most). Every change reloads
 * it, because counts, parents and tree order may all move.
 */
@Injectable()
export class CategoriesStore {
  private readonly list = inject(ListCategoriesUseCase);
  private readonly saveCategory = inject(SaveCategoryUseCase);
  private readonly deleteCategory = inject(DeleteCategoryUseCase);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _categories = signal<Category[]>([]);
  readonly categories = this._categories.asReadonly();
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<AppError | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.list
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this._categories.set(categories);
          this.loading.set(false);
          this.loaded.set(true);
        },
        error: (error: unknown) => {
          this.error.set(toAppError(error));
          this.loading.set(false);
        },
      });
  }

  save(draft: CategoryDraft, existing: Category | null): Observable<Category> {
    const request = existing
      ? this.saveCategory.update(existing.id, draft, existing.version)
      : this.saveCategory.create(draft);
    return request.pipe(tap(() => this.load()));
  }

  delete(category: Category): Observable<void> {
    return this.deleteCategory.execute(category.id).pipe(tap(() => this.load()));
  }
}
