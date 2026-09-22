import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  DEFAULT_FILTERS,
  DashboardFilters,
  DashboardSummary,
  OperationType,
  RecentOperation,
  StockFlow,
  TopMovements,
} from '../../domain/entities/dashboard';
import {
  CompanyDashboardUseCase,
  isCompleteFilter,
} from '../../domain/use-cases/dashboard.use-cases';
import { WidgetState } from './widget-state';

/**
 * Company dashboard state. One filter change (period or location) refreshes
 * every time-dependent widget together: summary, chart and top products are
 * three requests in parallel, not one per card.
 */
@Injectable()
export class CompanyDashboardStore {
  private readonly dashboard = inject(CompanyDashboardUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly filters = signal<DashboardFilters>(DEFAULT_FILTERS);
  /** Operation type shown in the recent activity (storekeeper tabs); null = all. */
  readonly activityType = signal<OperationType | null>(null);

  readonly summary = new WidgetState<DashboardSummary>(this.destroyRef);
  readonly flow = new WidgetState<StockFlow>(this.destroyRef);
  readonly top = new WidgetState<TopMovements>(this.destroyRef);
  readonly recent = new WidgetState<RecentOperation[]>(this.destroyRef);

  private withTop = true;

  /** `withTop`: the storekeeper dashboard has no top products widget. */
  load(withTop = true): void {
    this.withTop = withTop;
    this.loadPeriodWidgets();
    this.loadRecent();
  }

  /** Applies a new filter; an incomplete custom period waits for its second date. */
  applyFilters(change: Partial<DashboardFilters>): void {
    const previous = this.filters();
    const next = { ...previous, ...change };
    if (next.period !== 'CUSTOM') {
      next.from = null;
      next.to = null;
    }
    this.filters.set(next);
    if (!isCompleteFilter(next)) return;
    this.loadPeriodWidgets();
    if (next.locationId !== previous.locationId) this.loadRecent();
  }

  showActivity(type: OperationType | null): void {
    this.activityType.set(type);
    this.loadRecent();
  }

  reloadSummary(): void {
    this.summary.load(this.dashboard.summary(this.filters()));
  }
  reloadFlow(): void {
    this.flow.load(this.dashboard.stockFlow(this.filters()));
  }
  reloadTop(): void {
    this.top.load(this.dashboard.topMovements(this.filters()));
  }
  loadRecent(): void {
    this.recent.load(
      this.dashboard.recentActivity(this.filters().locationId, this.activityType(), 8),
    );
  }

  private loadPeriodWidgets(): void {
    this.reloadSummary();
    this.reloadFlow();
    if (this.withTop) this.reloadTop();
  }
}
