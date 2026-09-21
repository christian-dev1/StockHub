import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page, PageRequest } from '../../../../shared/utils/page';
import {
  AdminAccount,
  Company,
  CompanyFilters,
  CompanyOnboarding,
  CompanyProfile,
} from '../entities/company';
import { CompaniesRepository } from '../repositories/companies.repository';

@Injectable()
export class SearchCompaniesUseCase {
  private readonly repository = inject(CompaniesRepository);
  execute(request: PageRequest, filters: CompanyFilters): Observable<Page<Company>> {
    return this.repository.search(request, { ...filters, text: filters.text.trim() });
  }
}

@Injectable()
export class GetCompanyUseCase {
  private readonly repository = inject(CompaniesRepository);
  execute(id: string): Observable<Company> {
    return this.repository.get(id);
  }
}

/** Creates a company, its primary location and its first administrator (atomic on the server). */
@Injectable()
export class OnboardCompanyUseCase {
  private readonly repository = inject(CompaniesRepository);
  execute(onboarding: CompanyOnboarding): Observable<Company> {
    return this.repository.onboard(onboarding);
  }
}

@Injectable()
export class UpdateCompanyProfileUseCase {
  private readonly repository = inject(CompaniesRepository);
  execute(id: string, profile: CompanyProfile, version: number): Observable<Company> {
    return this.repository.updateProfile(id, profile, version);
  }
}

@Injectable()
export class ChangeCompanyStatusUseCase {
  private readonly repository = inject(CompaniesRepository);
  disable(id: string, reason: string): Observable<Company> {
    return this.repository.disable(id, reason.trim());
  }
  activate(id: string): Observable<Company> {
    return this.repository.activate(id);
  }
}

@Injectable()
export class AddCompanyAdminUseCase {
  private readonly repository = inject(CompaniesRepository);
  execute(id: string, admin: AdminAccount): Observable<void> {
    return this.repository.addAdmin(id, admin);
  }
}
