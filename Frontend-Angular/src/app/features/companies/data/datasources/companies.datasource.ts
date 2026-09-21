import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { Page } from '../../../../shared/utils/page';
import { CompanyModel, OnboardingModel } from '../models/company.model';

@Injectable()
export class CompaniesDataSource {
  private readonly http = inject(HttpClient);

  search(params: Record<string, string>): Observable<Page<CompanyModel>> {
    return this.http.get<Page<CompanyModel>>(API_ROUTES.PLATFORM.COMPANIES, { params });
  }

  get(id: string): Observable<CompanyModel> {
    return this.http.get<CompanyModel>(API_ROUTES.PLATFORM.COMPANY(id));
  }

  create(body: unknown): Observable<OnboardingModel> {
    return this.http.post<OnboardingModel>(API_ROUTES.PLATFORM.COMPANIES, body);
  }

  update(id: string, body: unknown): Observable<CompanyModel> {
    return this.http.put<CompanyModel>(API_ROUTES.PLATFORM.COMPANY(id), body);
  }

  disable(id: string, reason: string): Observable<CompanyModel> {
    return this.http.post<CompanyModel>(API_ROUTES.PLATFORM.COMPANY_DISABLE(id), { reason });
  }

  activate(id: string): Observable<CompanyModel> {
    return this.http.post<CompanyModel>(API_ROUTES.PLATFORM.COMPANY_ACTIVATE(id), null);
  }

  addAdmin(id: string, body: unknown): Observable<unknown> {
    return this.http.post(API_ROUTES.PLATFORM.COMPANY_ADMINS(id), body);
  }
}
