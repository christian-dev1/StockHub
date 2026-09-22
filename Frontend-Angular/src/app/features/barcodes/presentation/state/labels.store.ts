import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, switchMap, tap } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { toAppError } from '../../../../shared/utils/resource-state';
import {
  LabelLayout,
  LabelProduct,
  LabelRequest,
  labelRequestProblem,
  labelsPerPage,
  totalLabels,
} from '../../domain/entities/barcode';
import { PrintLabelsUseCase } from '../../domain/use-cases/barcode.use-cases';

export interface LabelSelection {
  readonly product: LabelProduct;
  readonly copies: number;
}

/** Products picked for a label run, the sheet options and the generated PDF. */
@Injectable()
export class LabelsStore {
  private readonly labels = inject(PrintLabelsUseCase);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searches = new Subject<string>();

  readonly results = signal<LabelProduct[]>([]);
  readonly searching = signal(false);
  readonly selection = signal<LabelSelection[]>([]);
  readonly layout = signal<LabelLayout>('A4_3X8');
  readonly showPrice = signal(true);
  /** 1-based position shown to the user (the API counts from 0). */
  readonly startPosition = signal(1);
  readonly busy = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly request = computed<LabelRequest>(() => ({
    items: this.selection().map((s) => ({ productId: s.product.id, copies: s.copies })),
    layout: this.layout(),
    showPrice: this.showPrice(),
    startPosition: this.startPosition() - 1,
  }));
  readonly total = computed(() => totalLabels(this.request().items));
  readonly perPage = computed(() => labelsPerPage(this.layout()));
  readonly pages = computed(() =>
    this.total() === 0 ? 0 : Math.ceil((this.total() + this.startPosition() - 1) / this.perPage()),
  );
  readonly problem = computed(() => labelRequestProblem(this.request()));

  constructor() {
    this.searches
      .pipe(
        tap(() => this.searching.set(true)),
        switchMap((text) => this.labels.search(text)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (products) => {
          this.results.set(products);
          this.searching.set(false);
        },
        error: (error: unknown) => {
          this.error.set(toAppError(error));
          this.searching.set(false);
        },
      });
  }

  search(text: string): void {
    this.searches.next(text);
  }

  preselect(ids: readonly string[]): void {
    this.labels
      .products(ids)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => products.filter((p) => p.barcode).forEach((p) => this.add(p)));
  }

  add(product: LabelProduct): void {
    if (this.selection().some((s) => s.product.id === product.id)) return;
    this.selection.update((list) => [...list, { product, copies: 1 }]);
  }

  setCopies(productId: string, copies: number | null): void {
    this.selection.update((list) =>
      list.map((s) => (s.product.id === productId ? { ...s, copies: copies ?? 0 } : s)),
    );
  }

  remove(productId: string): void {
    this.selection.update((list) => list.filter((s) => s.product.id !== productId));
  }

  isSelected(productId: string): boolean {
    return this.selection().some((s) => s.product.id === productId);
  }

  generate(): Observable<Blob> | null {
    if (this.problem()) return null;
    this.busy.set(true);
    this.error.set(null);
    return this.labels.execute(this.request()).pipe(
      tap({
        next: () => this.busy.set(false),
        error: (error: unknown) => {
          this.error.set(toAppError(error));
          this.busy.set(false);
        },
      }),
    );
  }
}
