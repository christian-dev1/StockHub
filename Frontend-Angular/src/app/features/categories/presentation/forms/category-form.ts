import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Category, CategoryDraft } from '../../domain/entities/category';

export function categoryForm(fb: NonNullableFormBuilder, category?: Category | null) {
  return fb.group({
    name: [category?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    description: [category?.description ?? '', Validators.maxLength(500)],
    parentId: fb.control<string | null>(category?.parentId ?? null),
  });
}

export type CategoryForm = ReturnType<typeof categoryForm>;

export function toCategoryDraft(form: CategoryForm): CategoryDraft {
  return form.getRawValue();
}
