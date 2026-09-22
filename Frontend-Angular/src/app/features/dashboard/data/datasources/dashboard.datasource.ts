import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import {
  PlatformDashboardModel,
  RecentOperationModel,
  StockFlowModel,
  SummaryModel,
  TopMovementsModel,
} from '../models/dashboard.model';

@Injectable()
export class DashboardDataSource {
  private readonly http = inject(HttpClient);

  summary(params: Record<string, string>): Observable<SummaryModel> {
    return this.http.get<SummaryModel>(API_ROUTES.DASHBOARD.SUMMARY, { params });
  }
  stockFlow(params: Record<string, string>): Observable<StockFlowModel> {
    return this.http.get<StockFlowModel>(API_ROUTES.DASHBOARD.STOCK_FLOW, { params });
  }
  recentActivity(params: Record<string, string>): Observable<RecentOperationModel[]> {
    return this.http.get<RecentOperationModel[]>(API_ROUTES.DASHBOARD.RECENT_ACTIVITY, { params });
  }
  topMovements(params: Record<string, string>): Observable<TopMovementsModel> {
    return this.http.get<TopMovementsModel>(API_ROUTES.DASHBOARD.TOP_MOVEMENTS, { params });
  }
  platform(params: Record<string, string>): Observable<PlatformDashboardModel> {
    return this.http.get<PlatformDashboardModel>(API_ROUTES.DASHBOARD.PLATFORM, { params });
  }
}
