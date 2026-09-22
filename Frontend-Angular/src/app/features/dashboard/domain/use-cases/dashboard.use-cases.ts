import { Injectable, inject } from '@angular/core';
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
import { DashboardRepository } from '../repositories/dashboard.repository';

/** Company dashboard: every figure is computed by the backend. */
@Injectable()
export class CompanyDashboardUseCase {
  private readonly repository = inject(DashboardRepository);

  summary(filters: DashboardFilters): Observable<DashboardSummary> {
    return this.repository.summary(filters);
  }
  stockFlow(filters: DashboardFilters): Observable<StockFlow> {
    return this.repository.stockFlow(filters);
  }
  recentActivity(
    locationId: string | null,
    type: OperationType | null = null,
    limit = 8,
  ): Observable<RecentOperation[]> {
    return this.repository.recentActivity(locationId, type, limit);
  }
  topMovements(filters: DashboardFilters, limit = 5): Observable<TopMovements> {
    return this.repository.topMovements(filters, limit);
  }
}

@Injectable()
export class PlatformDashboardUseCase {
  private readonly repository = inject(DashboardRepository);

  execute(
    period: PeriodCode,
    from: string | null,
    to: string | null,
  ): Observable<PlatformDashboard> {
    return this.repository.platform(period, from, to);
  }
}

/** A custom period can be sent once both days are chosen and in order. */
export function isCompleteFilter(filters: DashboardFilters): boolean {
  if (filters.period !== 'CUSTOM') return true;
  return !!filters.from && !!filters.to && filters.from <= filters.to;
}
