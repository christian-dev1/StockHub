import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors } from '../../../../core/errors/with-app-errors';
import {
  DashboardFilters,
  DashboardSummary,
  OperationType,
  PeriodCode,
  PlatformDashboard,
  RecentOperation,
  StockFlow,
  TopMovements,
} from '../../domain/entities/dashboard';
import { DashboardRepository } from '../../domain/repositories/dashboard.repository';
import { DashboardDataSource } from '../datasources/dashboard.datasource';
import {
  toDashboardParams,
  toPlatformDashboard,
  toRecentOperation,
  toStockFlow,
  toSummary,
  toTopMovements,
} from '../mappers/dashboard.mapper';

@Injectable()
export class HttpDashboardRepository extends DashboardRepository {
  private readonly source = inject(DashboardDataSource);

  summary(filters: DashboardFilters): Observable<DashboardSummary> {
    return this.source.summary(toDashboardParams(filters)).pipe(map(toSummary), withAppErrors());
  }

  stockFlow(filters: DashboardFilters): Observable<StockFlow> {
    return this.source
      .stockFlow(toDashboardParams(filters))
      .pipe(map(toStockFlow), withAppErrors());
  }

  recentActivity(
    locationId: string | null,
    type: OperationType | null,
    limit: number,
  ): Observable<RecentOperation[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (locationId) params['locationId'] = locationId;
    if (type) params['type'] = type;
    return this.source.recentActivity(params).pipe(
      map((operations) => operations.map(toRecentOperation)),
      withAppErrors(),
    );
  }

  topMovements(filters: DashboardFilters, limit: number): Observable<TopMovements> {
    return this.source
      .topMovements({ ...toDashboardParams(filters), limit: String(limit) })
      .pipe(map(toTopMovements), withAppErrors());
  }

  platform(
    period: PeriodCode,
    from: string | null,
    to: string | null,
  ): Observable<PlatformDashboard> {
    const params: Record<string, string> = { period };
    if (period === 'CUSTOM') {
      if (from) params['from'] = from;
      if (to) params['to'] = to;
    }
    return this.source.platform(params).pipe(map(toPlatformDashboard), withAppErrors());
  }
}
