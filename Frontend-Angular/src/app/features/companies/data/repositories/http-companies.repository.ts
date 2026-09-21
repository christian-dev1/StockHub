import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors } from '../../../../core/errors/with-app-errors';
import { Page, PageRequest, mapPage, toQueryParams } from '../../../../shared/utils/page';
import {
  AdminAccount,
  Company,
  CompanyFilters,
  CompanyOnboarding,
  CompanyProfile,
} from '../../domain/entities/company';
import { CompaniesRepository } from '../../domain/repositories/companies.repository';
import { CompaniesDataSource } from '../datasources/companies.datasource';
import { toCompany, toProfilePayload } from '../mappers/company.mapper';

@Injectable()
export class HttpCompaniesRepository extends CompaniesRepository {
  private readonly source = inject(CompaniesDataSource);

  search(request: PageRequest, filters: CompanyFilters): Observable<Page<Company>> {
    return this.source
      .search(toQueryParams(request, { q: filters.text, status: filters.status }))
      .pipe(
        map((page) => mapPage(page, toCompany)),
        withAppErrors(),
      );
  }

  get(id: string): Observable<Company> {
    return this.source.get(id).pipe(map(toCompany), withAppErrors());
  }

  onboard(onboarding: CompanyOnboarding): Observable<Company> {
    const body = {
      profile: toProfilePayload(onboarding.profile),
      currency: onboarding.currency,
      timezone: onboarding.timezone,
      locale: onboarding.locale,
      admin: { ...onboarding.admin, email: onboarding.admin.email.trim() },
    };
    return this.source.create(body).pipe(
      map((result) => toCompany(result.company)),
      withAppErrors(),
    );
  }

  updateProfile(id: string, profile: CompanyProfile, version: number): Observable<Company> {
    return this.source
      .update(id, { profile: toProfilePayload(profile), version })
      .pipe(map(toCompany), withAppErrors());
  }

  disable(id: string, reason: string): Observable<Company> {
    return this.source.disable(id, reason).pipe(map(toCompany), withAppErrors());
  }

  activate(id: string): Observable<Company> {
    return this.source.activate(id).pipe(map(toCompany), withAppErrors());
  }

  addAdmin(id: string, admin: AdminAccount): Observable<void> {
    return this.source.addAdmin(id, admin).pipe(
      map(() => undefined),
      withAppErrors(),
    );
  }
}
