import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { CategoryOption, SupplierOption } from '../../domain/entities/product';
import { GetProductReferencesUseCase } from '../../domain/use-cases/product.use-cases';

/** Categories and active suppliers offered by the product filters and form. */
@Injectable()
export class ProductReferencesStore {
  private readonly references = inject(GetProductReferencesUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<CategoryOption[]>([]);
  readonly suppliers = signal<SupplierOption[]>([]);
  readonly loaded = signal(false);

  readonly categoryOptions = computed(() =>
    this.categories().map((c) => ({
      value: c.id,
      label: c.parentName ? `${c.parentName} › ${c.name}` : c.name,
    })),
  );

  load(): void {
    forkJoin({ categories: this.references.categories(), suppliers: this.references.suppliers() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, suppliers }) => {
          this.categories.set(categories);
          this.suppliers.set(suppliers);
          this.loaded.set(true);
        },
        // The form stays usable without them (both fields are optional).
        error: () => this.loaded.set(true),
      });
  }

  /** Active suppliers, plus the current (possibly inactive) supplier of an edited product. */
  supplierOptions(current?: { id: string | null; name: string | null }) {
    const options = this.suppliers().map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));
    if (current?.id && !options.some((o) => o.value === current.id)) {
      options.unshift({ value: current.id, label: current.name ?? current.id });
    }
    return options;
  }
}
