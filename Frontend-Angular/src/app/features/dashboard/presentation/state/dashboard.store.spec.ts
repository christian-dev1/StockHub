import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { SystemHealth } from '../../domain/entities/system-health';
import { SystemHealthRepository } from '../../domain/repositories/system-health.repository';
import { GetSystemHealthUseCase } from '../../domain/use-cases/get-system-health.use-case';
import { DashboardStore } from './dashboard.store';

describe('DashboardStore', () => {
  function setup(repository: SystemHealthRepository): DashboardStore {
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        GetSystemHealthUseCase,
        { provide: SystemHealthRepository, useValue: repository },
      ],
    });
    return TestBed.inject(DashboardStore);
  }

  it('goes through loading then success', () => {
    const response = new Subject<SystemHealth>();
    const store = setup({ check: () => response });

    store.loadHealth();
    expect(store.health().status).toBe('loading');

    const health: SystemHealth = { status: 'UP', checkedAt: new Date() };
    response.next(health);
    expect(store.health()).toEqual({ status: 'success', data: health });
  });

  it('exposes mapped errors', () => {
    const error: AppError = {
      kind: 'network',
      status: 0,
      code: 'NETWORK_ERROR',
      message: '',
      fieldErrors: [],
    };
    const store = setup({ check: () => throwError(() => error) });

    store.loadHealth();

    expect(store.health()).toEqual({ status: 'error', error });
  });

  it('wraps unknown errors into a generic AppError', () => {
    const store = setup({ check: () => throwError(() => new Error('boom')) });
    store.loadHealth();
    const state = store.health();
    expect(state.status === 'error' && state.error.code).toBe('INTERNAL_ERROR');
  });

  it('can reload after success', () => {
    const store = setup({
      check: () => of<SystemHealth>({ status: 'DOWN', checkedAt: new Date() }),
    });
    store.loadHealth();
    store.loadHealth();
    const state = store.health();
    expect(state.status === 'success' && state.data.status).toBe('DOWN');
  });
});
