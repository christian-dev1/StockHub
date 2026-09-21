import { Provider } from '@angular/core';
import { CompanySettingsDataSource } from './data/datasources/company-settings.datasource';
import { HttpCompanySettingsRepository } from './data/repositories/http-company-settings.repository';
import { CompanySettingsRepository } from './domain/repositories/company-settings.repository';
import {
  GetCurrentCompanyUseCase,
  UpdateCurrentCompanyUseCase,
} from './domain/use-cases/company-settings.use-cases';

export const SETTINGS_PROVIDERS: Provider[] = [
  CompanySettingsDataSource,
  { provide: CompanySettingsRepository, useClass: HttpCompanySettingsRepository },
  GetCurrentCompanyUseCase,
  UpdateCurrentCompanyUseCase,
];
