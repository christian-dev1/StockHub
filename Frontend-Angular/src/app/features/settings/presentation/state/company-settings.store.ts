import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthStore } from '../../../../core/auth/auth-store';
import { AppError } from '../../../../core/errors/app-error';
import { isAppError } from '../../../../core/errors/http-error.mapper';
import { LoadState, failure, idle, loading, success } from '../../../../shared/utils/load-state';
import {
  CompanyProfileUpdate,
  CompanySettingsUpdate,
  CurrentCompany,
} from '../../domain/entities/company-settings';
import {
  GetCurrentCompanyUseCase,
  UpdateCurrentCompanyUseCase,
} from '../../domain/use-cases/company-settings.use-cases';

const UNKNOWN: AppError = {
  kind: 'server',
  status: 0,
  code: 'INTERNAL_ERROR',
  message: '',
  fieldErrors: [],
};

@Injectable()
export class CompanySettingsStore {
  private readonly getCurrent = inject(GetCurrentCompanyUseCase);
  private readonly update = inject(UpdateCurrentCompanyUseCase);
  private readonly auth = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _state = signal<LoadState<CurrentCompany>>(idle());
  readonly state = this._state.asReadonly();
  readonly company = computed(() => {
    const s = this._state();
    return s.status === 'success' ? s.data : null;
  });

  load(): void {
    this._state.set(loading());
    this.getCurrent
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (company) => this._state.set(success(company)),
        error: (error: unknown) => this._state.set(failure(isAppError(error) ? error : UNKNOWN)),
      });
  }

  saveProfile(profile: CompanyProfileUpdate): Observable<unknown> {
    return this.persist(this.update.profile(profile, this.require().version));
  }

  saveSettings(settings: CompanySettingsUpdate): Observable<unknown> {
    return this.persist(this.update.settings(settings, this.require().version));
  }

  /** The session carries company name/currency: refresh it so the whole UI stays consistent. */
  private persist(request: Observable<CurrentCompany>): Observable<unknown> {
    return request.pipe(
      tap((company) => this._state.set(success(company))),
      switchMap(() => this.auth.reloadSession()),
    );
  }

  private require(): CurrentCompany {
    const company = this.company();
    if (!company) throw new Error('Company not loaded');
    return company;
  }
}
