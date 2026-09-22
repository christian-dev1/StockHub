import { DestroyRef, WritableSignal, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { AppError } from '../../core/errors/app-error';
import { isAppError } from '../../core/errors/http-error.mapper';
import { SortState } from '../ui/data-table/data-table';
import { PageChange } from '../ui/pagination/pagination';
import { Page, PageRequest } from './page';

type Result<T> = { ok: true; page: Page<T> } | { ok: false; error: AppError };

const UNKNOWN: AppError = {
  kind: 'server',
  status: 0,
  code: 'INTERNAL_ERROR',
  message: '',
  fieldErrors: [],
};

/**
 * Signal-based state of a server-side paginated, sorted and filtered list.
 * Each change cancels the in-flight request (switchMap), so responses never
 * arrive out of order.
 */
export class PagedList<T, F extends object> {
  readonly filters: WritableSignal<F>;
  readonly page = signal(0);
  readonly size = signal(20);
  readonly sort = signal<SortState | null>(null);
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);
  private readonly result = signal<Page<T> | null>(null);

  readonly rows = computed(() => this.result()?.content ?? []);
  readonly total = computed(() => this.result()?.totalElements ?? 0);

  /**
   * True when a filter narrows the list: an empty result then means "no match"
   * rather than "nothing exists yet", and deserves a different message.
   */
  readonly filtered = computed(() => hasActiveFilter(this.filters()));

  private readonly requests = new Subject<void>();

  constructor(
    fetch: (request: PageRequest, filters: F) => Observable<Page<T>>,
    private readonly initialFilters: F,
    destroyRef: DestroyRef,
    initialSort: SortState | null = null,
  ) {
    this.filters = signal<F>(initialFilters);
    this.sort.set(initialSort);
    this.requests
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          return fetch(
            { page: this.page(), size: this.size(), sort: this.sort() },
            this.filters(),
          ).pipe(
            map((page): Result<T> => ({ ok: true, page })),
            catchError((error: unknown) =>
              of<Result<T>>({ ok: false, error: isAppError(error) ? error : UNKNOWN }),
            ),
          );
        }),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (result.ok) {
          this.error.set(null);
          this.result.set(result.page);
        } else {
          this.error.set(result.error);
        }
      });
  }

  load(): void {
    this.requests.next();
  }

  changePage(change: PageChange): void {
    this.page.set(change.page);
    this.size.set(change.size);
    this.load();
  }

  changeSort(sort: SortState): void {
    this.sort.set(sort);
    this.page.set(0);
    this.load();
  }

  applyFilters(filters: F): void {
    this.filters.set(filters);
    this.page.set(0);
    this.load();
  }

  clearFilters(): void {
    this.applyFilters(this.initialFilters);
  }
}

function hasActiveFilter(filters: object): boolean {
  return Object.values(filters).some((value: unknown) =>
    typeof value === 'string' ? value.trim() !== '' : value !== null && value !== undefined,
  );
}
