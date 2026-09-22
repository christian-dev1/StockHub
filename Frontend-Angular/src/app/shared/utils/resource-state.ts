import { DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { AppError } from '../../core/errors/app-error';
import { isAppError } from '../../core/errors/http-error.mapper';
import { LoadState, failure, idle, loading, success } from './load-state';

export const UNKNOWN_ERROR: AppError = {
  kind: 'server',
  status: 0,
  code: 'INTERNAL_ERROR',
  message: '',
  fieldErrors: [],
};

export function toAppError(error: unknown): AppError {
  return isAppError(error) ? error : UNKNOWN_ERROR;
}

/**
 * State of one loaded resource (a detail page): loading, success or error,
 * plus `keep` to store the fresh value returned by a mutation.
 */
export class ResourceState<T> {
  private readonly _state = signal<LoadState<T>>(idle());
  readonly state = this._state.asReadonly();
  readonly data = computed(() => {
    const state = this._state();
    return state.status === 'success' ? state.data : null;
  });

  constructor(private readonly destroyRef: DestroyRef) {}

  load(request: Observable<T>): void {
    this._state.set(loading());
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (value) => this._state.set(success(value)),
      error: (error: unknown) => this._state.set(failure(toAppError(error))),
    });
  }

  keep(request: Observable<T>): Observable<T> {
    return request.pipe(tap((value) => this._state.set(success(value))));
  }

  set(value: T): void {
    this._state.set(success(value));
  }

  require(): T {
    const value = this.data();
    if (value === null) throw new Error('Resource not loaded');
    return value;
  }
}
