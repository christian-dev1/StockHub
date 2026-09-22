import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryDraft } from '../entities/category';
import { CategoriesRepository } from '../repositories/categories.repository';

/** Returned in tree order by the API (each category followed by its sub-categories). */
@Injectable()
export class ListCategoriesUseCase {
  private readonly repository = inject(CategoriesRepository);
  execute(text = ''): Observable<Category[]> {
    return this.repository.list(text.trim());
  }
}

@Injectable()
export class SaveCategoryUseCase {
  private readonly repository = inject(CategoriesRepository);

  create(draft: CategoryDraft): Observable<Category> {
    return this.repository.create(normalize(draft));
  }

  update(id: string, draft: CategoryDraft, version: number): Observable<Category> {
    return this.repository.update(id, normalize(draft), version);
  }
}

@Injectable()
export class DeleteCategoryUseCase {
  private readonly repository = inject(CategoriesRepository);
  execute(id: string): Observable<void> {
    return this.repository.delete(id);
  }
}

function normalize(draft: CategoryDraft): CategoryDraft {
  return {
    name: draft.name.trim(),
    description: draft.description?.trim() || null,
    parentId: draft.parentId || null,
  };
}
