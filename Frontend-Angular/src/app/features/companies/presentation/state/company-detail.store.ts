import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { isAppError } from '../../../../core/errors/http-error.mapper';
import { LoadState, failure, idle, loading, success } from '../../../../shared/utils/load-state';
import { AdminAccount, Company, CompanyProfile } from '../../domain/entities/company';
import {
  AddCompanyAdminUseCase,
  ChangeCompanyStatusUseCase,
  GetCompanyUseCase,
  UpdateCompanyProfileUseCase,
} from '../../domain/use-cases/company.use-cases';

const UNKNOWN: AppError = {
  kind: 'server',
  status: 0,
  code: 'INTERNAL_ERROR',
  message: '',
  fieldErrors: [],
};

@Injectable()
export class CompanyDetailStore {
  private readonly getCompany = inject(GetCompanyUseCase);
  private readonly updateProfile = inject(UpdateCompanyProfileUseCase);
  private readonly changeStatus = inject(ChangeCompanyStatusUseCase);
  private readonly addAdmin = inject(AddCompanyAdminUseCase);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _state = signal<LoadState<Company>>(idle());
  readonly state = this._state.asReadonly();
  readonly company = computed(() => {
    const state = this._state();
    return state.status === 'success' ? state.data : null;
  });

  load(id: string): void {
    this._state.set(loading());
    this.getCompany
      .execute(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (company) => this._state.set(success(company)),
        error: (error: unknown) => this._state.set(failure(isAppError(error) ? error : UNKNOWN)),
      });
  }

  saveProfile(profile: CompanyProfile): Observable<Company> {
    const company = this.requireCompany();
    return this.updateProfile
      .execute(company.id, profile, company.version)
      .pipe(tap((c) => this._state.set(success(c))));
  }

  disable(reason: string): Observable<Company> {
    return this.changeStatus
      .disable(this.requireCompany().id, reason)
      .pipe(tap((c) => this._state.set(success(c))));
  }

  activate(): Observable<Company> {
    return this.changeStatus
      .activate(this.requireCompany().id)
      .pipe(tap((c) => this._state.set(success(c))));
  }

  createAdmin(admin: AdminAccount): Observable<void> {
    return this.addAdmin.execute(this.requireCompany().id, admin);
  }

  private requireCompany(): Company {
    const company = this.company();
    if (!company) {
      throw new Error('Company not loaded');
    }
    return company;
  }
}
