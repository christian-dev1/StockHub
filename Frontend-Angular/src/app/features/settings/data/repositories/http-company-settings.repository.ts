import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors } from '../../../../core/errors/with-app-errors';
import {
  CompanyProfileUpdate,
  CompanySettingsUpdate,
  CurrentCompany,
} from '../../domain/entities/company-settings';
import { CompanySettingsRepository } from '../../domain/repositories/company-settings.repository';
import { CompanySettingsDataSource } from '../datasources/company-settings.datasource';
import { toCurrentCompany } from '../mappers/current-company.mapper';

const blankToNull = (value: string | null) => (value && value.trim() ? value.trim() : null);

@Injectable()
export class HttpCompanySettingsRepository extends CompanySettingsRepository {
  private readonly source = inject(CompanySettingsDataSource);

  current(): Observable<CurrentCompany> {
    return this.source.current().pipe(map(toCurrentCompany), withAppErrors());
  }

  updateProfile(profile: CompanyProfileUpdate, version: number): Observable<CurrentCompany> {
    const body = {
      profile: {
        name: profile.name.trim(),
        legalName: blankToNull(profile.legalName),
        email: blankToNull(profile.email),
        phone: blankToNull(profile.phone),
        addressLine: blankToNull(profile.addressLine),
        city: blankToNull(profile.city),
        country: blankToNull(profile.country)?.toUpperCase() ?? null,
      },
      version,
    };
    return this.source.updateProfile(body).pipe(map(toCurrentCompany), withAppErrors());
  }

  updateSettings(settings: CompanySettingsUpdate, version: number): Observable<CurrentCompany> {
    return this.source
      .updateSettings({ ...settings, version })
      .pipe(map(toCurrentCompany), withAppErrors());
  }
}
