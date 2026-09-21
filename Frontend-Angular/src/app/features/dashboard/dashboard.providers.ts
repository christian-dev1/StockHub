import { Provider } from '@angular/core';
import { SystemHealthDataSource } from './data/datasources/system-health.datasource';
import { HttpSystemHealthRepository } from './data/repositories/http-system-health.repository';
import { SystemHealthRepository } from './domain/repositories/system-health.repository';
import { GetSystemHealthUseCase } from './domain/use-cases/get-system-health.use-case';
import { DashboardStore } from './presentation/state/dashboard.store';

/** Wires the feature's clean-architecture layers; registered on the feature route. */
export const DASHBOARD_PROVIDERS: Provider[] = [
  SystemHealthDataSource,
  { provide: SystemHealthRepository, useClass: HttpSystemHealthRepository },
  GetSystemHealthUseCase,
  DashboardStore,
];
