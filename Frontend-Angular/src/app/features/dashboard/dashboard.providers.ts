import { Provider } from '@angular/core';
import { DashboardDataSource } from './data/datasources/dashboard.datasource';
import { SystemHealthDataSource } from './data/datasources/system-health.datasource';
import { HttpDashboardRepository } from './data/repositories/http-dashboard.repository';
import { HttpSystemHealthRepository } from './data/repositories/http-system-health.repository';
import { DashboardRepository } from './domain/repositories/dashboard.repository';
import { SystemHealthRepository } from './domain/repositories/system-health.repository';
import {
  CompanyDashboardUseCase,
  PlatformDashboardUseCase,
} from './domain/use-cases/dashboard.use-cases';
import { GetSystemHealthUseCase } from './domain/use-cases/get-system-health.use-case';
import { DashboardStore } from './presentation/state/dashboard.store';

/** Wires the feature's clean-architecture layers; registered on the feature route. */
export const DASHBOARD_PROVIDERS: Provider[] = [
  SystemHealthDataSource,
  { provide: SystemHealthRepository, useClass: HttpSystemHealthRepository },
  GetSystemHealthUseCase,
  DashboardStore,
  DashboardDataSource,
  { provide: DashboardRepository, useClass: HttpDashboardRepository },
  CompanyDashboardUseCase,
  PlatformDashboardUseCase,
];
