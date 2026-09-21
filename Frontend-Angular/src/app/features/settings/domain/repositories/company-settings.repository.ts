import { Observable } from 'rxjs';
import {
  CompanyProfileUpdate,
  CompanySettingsUpdate,
  CurrentCompany,
} from '../entities/company-settings';

export abstract class CompanySettingsRepository {
  abstract current(): Observable<CurrentCompany>;
  abstract updateProfile(
    profile: CompanyProfileUpdate,
    version: number,
  ): Observable<CurrentCompany>;
  abstract updateSettings(
    settings: CompanySettingsUpdate,
    version: number,
  ): Observable<CurrentCompany>;
}
