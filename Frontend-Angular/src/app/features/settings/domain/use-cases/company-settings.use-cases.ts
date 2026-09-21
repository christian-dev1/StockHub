import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CompanyProfileUpdate,
  CompanySettingsUpdate,
  CurrentCompany,
} from '../entities/company-settings';
import { CompanySettingsRepository } from '../repositories/company-settings.repository';

@Injectable()
export class GetCurrentCompanyUseCase {
  private readonly repository = inject(CompanySettingsRepository);
  execute(): Observable<CurrentCompany> {
    return this.repository.current();
  }
}

@Injectable()
export class UpdateCurrentCompanyUseCase {
  private readonly repository = inject(CompanySettingsRepository);
  profile(profile: CompanyProfileUpdate, version: number): Observable<CurrentCompany> {
    return this.repository.updateProfile(profile, version);
  }
  settings(settings: CompanySettingsUpdate, version: number): Observable<CurrentCompany> {
    return this.repository.updateSettings(settings, version);
  }
}
