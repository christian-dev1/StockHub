import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { CurrentCompanyModel } from '../models/current-company.model';

@Injectable()
export class CompanySettingsDataSource {
  private readonly http = inject(HttpClient);

  current(): Observable<CurrentCompanyModel> {
    return this.http.get<CurrentCompanyModel>(API_ROUTES.COMPANY.CURRENT);
  }
  updateProfile(body: unknown): Observable<CurrentCompanyModel> {
    return this.http.put<CurrentCompanyModel>(API_ROUTES.COMPANY.CURRENT, body);
  }
  updateSettings(body: unknown): Observable<CurrentCompanyModel> {
    return this.http.put<CurrentCompanyModel>(API_ROUTES.COMPANY.SETTINGS, body);
  }
}
