import { Provider } from '@angular/core';
import { CompaniesDataSource } from './data/datasources/companies.datasource';
import { HttpCompaniesRepository } from './data/repositories/http-companies.repository';
import { CompaniesRepository } from './domain/repositories/companies.repository';
import {
  AddCompanyAdminUseCase,
  ChangeCompanyStatusUseCase,
  GetCompanyUseCase,
  OnboardCompanyUseCase,
  SearchCompaniesUseCase,
  UpdateCompanyProfileUseCase,
} from './domain/use-cases/company.use-cases';

export const COMPANIES_PROVIDERS: Provider[] = [
  CompaniesDataSource,
  { provide: CompaniesRepository, useClass: HttpCompaniesRepository },
  SearchCompaniesUseCase,
  GetCompanyUseCase,
  OnboardCompanyUseCase,
  UpdateCompanyProfileUseCase,
  ChangeCompanyStatusUseCase,
  AddCompanyAdminUseCase,
];
