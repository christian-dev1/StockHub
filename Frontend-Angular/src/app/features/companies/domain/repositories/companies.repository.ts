import { Observable } from 'rxjs';
import { Page, PageRequest } from '../../../../shared/utils/page';
import {
  AdminAccount,
  Company,
  CompanyFilters,
  CompanyOnboarding,
  CompanyProfile,
} from '../entities/company';

export abstract class CompaniesRepository {
  abstract search(request: PageRequest, filters: CompanyFilters): Observable<Page<Company>>;
  abstract get(id: string): Observable<Company>;
  abstract onboard(onboarding: CompanyOnboarding): Observable<Company>;
  abstract updateProfile(id: string, profile: CompanyProfile, version: number): Observable<Company>;
  abstract disable(id: string, reason: string): Observable<Company>;
  abstract activate(id: string): Observable<Company>;
  abstract addAdmin(id: string, admin: AdminAccount): Observable<void>;
}
