import { Provider } from '@angular/core';
import { DashboardDataSource } from './data/datasources/dashboard.datasource';
import { HttpDashboardRepository } from './data/repositories/http-dashboard.repository';
import { DashboardRepository } from './domain/repositories/dashboard.repository';
import {
  CompanyDashboardUseCase,
  PlatformDashboardUseCase,
} from './domain/use-cases/dashboard.use-cases';

/**
 * Dashboard figures. Provided by the (lazy) dashboard page rather than the
 * route, so that they stay out of the initial bundle.
 */
export const DASHBOARD_DATA_PROVIDERS: Provider[] = [
  DashboardDataSource,
  { provide: DashboardRepository, useClass: HttpDashboardRepository },
  CompanyDashboardUseCase,
  PlatformDashboardUseCase,
];
