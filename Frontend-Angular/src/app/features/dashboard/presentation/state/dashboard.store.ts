import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppError } from '../../../../core/errors/app-error';
import { isAppError } from '../../../../core/errors/http-error.mapper';
import { LoadState, failure, idle, loading, success } from '../../../../shared/utils/load-state';
import { SystemHealth } from '../../domain/entities/system-health';
import { GetSystemHealthUseCase } from '../../domain/use-cases/get-system-health.use-case';

const UNKNOWN_ERROR: AppError = {
  kind: 'server',
  status: 0,
  code: 'INTERNAL_ERROR',
  message: '',
  fieldErrors: [],
};

@Injectable()
export class DashboardStore {
  private readonly getSystemHealth = inject(GetSystemHealthUseCase);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _health = signal<LoadState<SystemHealth>>(idle());
  readonly health = this._health.asReadonly();

  loadHealth(): void {
    this._health.set(loading());
    this.getSystemHealth
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (health) => this._health.set(success(health)),
        error: (error: unknown) =>
          this._health.set(failure(isAppError(error) ? error : UNKNOWN_ERROR)),
      });
  }
}
