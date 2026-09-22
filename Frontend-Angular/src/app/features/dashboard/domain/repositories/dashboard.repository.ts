import { Observable } from 'rxjs';
import {
  DashboardFilters,
  DashboardSummary,
  OperationType,
  PeriodCode,
  PlatformDashboard,
  RecentOperation,
  StockFlow,
  TopMovements,
} from '../entities/dashboard';

export abstract class DashboardRepository {
  abstract summary(filters: DashboardFilters): Observable<DashboardSummary>;
  abstract stockFlow(filters: DashboardFilters): Observable<StockFlow>;
  abstract recentActivity(
    locationId: string | null,
    type: OperationType | null,
    limit: number,
  ): Observable<RecentOperation[]>;
  abstract topMovements(filters: DashboardFilters, limit: number): Observable<TopMovements>;
  abstract platform(
    period: PeriodCode,
    from: string | null,
    to: string | null,
  ): Observable<PlatformDashboard>;
}
