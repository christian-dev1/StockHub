import { DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { LoadState, failure, loading, success } from '../../../../shared/utils/load-state';
import { toAppError } from '../../../../shared/utils/resource-state';

/**
 * State of one dashboard widget. Each widget loads on its own, so an error in
 * the chart never blanks the KPIs; a new request cancels the previous one
 * (switchMap), so a quick period change never shows stale figures. The last
 * data stays visible while the next load runs (`data` vs `state`).
 */
export class WidgetState<T> {
  private readonly _state = signal<LoadState<T>>(loading());
  private readonly _data = signal<T | null>(null);
  private readonly requests = new Subject<Observable<T>>();

  readonly state = this._state.asReadonly();
  readonly data = this._data.asReadonly();
  readonly loading = computed(() => this._state().status === 'loading');
  readonly error = computed(() => {
    const state = this._state();
    return state.status === 'error' ? state.error : null;
  });

  constructor(destroyRef: DestroyRef) {
    this.requests
      .pipe(
        switchMap((request) =>
          request.pipe(
            map((value) => success<T>(value)),
            catchError((error: unknown) => of(failure<T>(toAppError(error)))),
          ),
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((state) => {
        this._state.set(state);
        if (state.status === 'success') this._data.set(state.data);
      });
  }

  load(request: Observable<T>): void {
    this._state.set(loading());
    this.requests.next(request);
  }
}
