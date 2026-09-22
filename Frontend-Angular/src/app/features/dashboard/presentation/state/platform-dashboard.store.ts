import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { PeriodCode, PlatformDashboard } from '../../domain/entities/dashboard';
import { PlatformDashboardUseCase } from '../../domain/use-cases/dashboard.use-cases';
import { WidgetState } from './widget-state';

@Injectable()
export class PlatformDashboardStore {
  private readonly platform = inject(PlatformDashboardUseCase);

  readonly period = signal<PeriodCode>('30D');
  readonly dashboard = new WidgetState<PlatformDashboard>(inject(DestroyRef));

  load(): void {
    this.dashboard.load(this.platform.execute(this.period(), null, null));
  }

  setPeriod(period: PeriodCode): void {
    this.period.set(period);
    this.load();
  }
}
