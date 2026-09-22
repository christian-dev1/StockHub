import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import {
  DashboardFilters,
  DashboardSummary,
  RecentOperation,
  StockFlow,
  TopMovements,
} from '../../domain/entities/dashboard';
import { CompanyDashboardUseCase } from '../../domain/use-cases/dashboard.use-cases';
import { CompanyDashboardStore } from './company-dashboard.store';

const SUMMARY: DashboardSummary = {
  period: { code: '30D', from: '2026-08-24', to: '2026-09-22', granularity: 'DAY' },
  scope: { locationId: null, locations: [], multiLocation: false, financial: true },
  catalogue: {
    activeProducts: 4,
    referencesInStock: 3,
    totalQuantity: 29,
    stockValue: 2020,
    currency: 'XAF',
  },
  status: { normal: 2, low: 1, out: 1, negative: 0 },
  batches: { expired: 1, expiringWithin7Days: 1, expiringSoon: 2, warningDays: 30 },
  activity: {
    today: {
      entries: 6,
      exits: 3,
      transfers: 1,
      adjustments: 0,
      entryQuantity: 40,
      exitQuantity: 11,
    },
    period: {
      entries: 6,
      exits: 3,
      transfers: 1,
      adjustments: 0,
      entryQuantity: 40,
      exitQuantity: 11,
    },
  },
  byLocation: [],
  attention: { outOfStock: [], lowStock: [], expiredBatches: [], expiringBatches: [] },
};

const FLOW: StockFlow = { period: SUMMARY.period, points: [] };
const TOP: TopMovements = { period: SUMMARY.period, products: [] };
const RECENT: RecentOperation[] = [];

interface Calls {
  summary: DashboardFilters[];
  flow: DashboardFilters[];
  top: DashboardFilters[];
  recent: { locationId: string | null; type: string | null; limit: number }[];
}

function setup(summaryImpl?: (filters: DashboardFilters) => Observable<DashboardSummary>) {
  const calls: Calls = { summary: [], flow: [], top: [], recent: [] };
  const useCase = {
    summary: (filters: DashboardFilters) => {
      calls.summary.push(filters);
      return summaryImpl ? summaryImpl(filters) : of(SUMMARY);
    },
    stockFlow: (filters: DashboardFilters) => {
      calls.flow.push(filters);
      return of(FLOW);
    },
    topMovements: (filters: DashboardFilters) => {
      calls.top.push(filters);
      return of(TOP);
    },
    recentActivity: (locationId: string | null, type: string | null, limit: number) => {
      calls.recent.push({ locationId, type, limit });
      return of(RECENT);
    },
  };
  TestBed.configureTestingModule({
    providers: [CompanyDashboardStore, { provide: CompanyDashboardUseCase, useValue: useCase }],
  });
  return { store: TestBed.inject(CompanyDashboardStore), calls };
}

describe('CompanyDashboardStore', () => {
  it('loads every widget through loading then success', () => {
    const { store } = setup();
    expect(store.summary.loading()).toBe(true);

    store.load();

    expect(store.summary.loading()).toBe(false);
    expect(store.summary.data()).toEqual(SUMMARY);
    expect(store.flow.data()).toEqual(FLOW);
    expect(store.top.data()).toEqual(TOP);
    expect(store.recent.data()).toEqual(RECENT);
    expect(store.summary.error()).toBeNull();
  });

  it('refreshes the time-dependent widgets together on a period change, not the activity', () => {
    const { store, calls } = setup();
    store.load();
    const before = {
      summary: calls.summary.length,
      flow: calls.flow.length,
      top: calls.top.length,
      recent: calls.recent.length,
    };

    store.applyFilters({ period: '7D' });

    expect(store.filters().period).toBe('7D');
    expect(calls.summary).toHaveLength(before.summary + 1);
    expect(calls.flow).toHaveLength(before.flow + 1);
    expect(calls.top).toHaveLength(before.top + 1);
    // The activity list is not time-filtered: no extra request.
    expect(calls.recent).toHaveLength(before.recent);
    expect(calls.summary.at(-1)?.period).toBe('7D');
  });

  it('reloads the activity when the location changes', () => {
    const { store, calls } = setup();
    store.load();

    store.applyFilters({ locationId: 'l2' });

    expect(calls.recent.at(-1)?.locationId).toBe('l2');
    expect(calls.summary.at(-1)?.['locationId']).toBe('l2');
    expect(store.filters().locationId).toBe('l2');
  });

  it('waits for both days of a custom period, then sends them', () => {
    const { store, calls } = setup();
    store.load();
    const before = calls.summary.length;

    store.applyFilters({ period: 'CUSTOM', from: '2026-09-01' });
    expect(calls.summary).toHaveLength(before);

    store.applyFilters({ to: '2026-09-22' });
    expect(calls.summary).toHaveLength(before + 1);
    expect(calls.summary.at(-1)).toMatchObject({
      period: 'CUSTOM',
      from: '2026-09-01',
      to: '2026-09-22',
    } satisfies Partial<DashboardFilters>);
  });

  it('drops the custom days when leaving the custom period', () => {
    const { store } = setup();
    store.applyFilters({ period: 'CUSTOM', from: '2026-09-01', to: '2026-09-22' });
    store.applyFilters({ period: '30D' });
    expect(store.filters()).toMatchObject({ period: '30D', from: null, to: null });
  });

  it('shows an error but keeps the last figures while a refresh fails', () => {
    const error: AppError = {
      kind: 'network',
      status: 0,
      code: 'NETWORK_ERROR',
      message: '',
      fieldErrors: [],
    };
    const failing = throwError(() => error);
    let fail = false;
    const { store } = setup(() => (fail ? failing : of(SUMMARY)));

    store.load();
    expect(store.summary.data()).toEqual(SUMMARY);

    fail = true;
    store.reloadSummary();

    expect(store.summary.error()).toEqual(error);
    // Previous data stays visible: one broken widget never blanks the dashboard.
    expect(store.summary.data()).toEqual(SUMMARY);
  });

  it('filters the recent activity by type from the storekeeper tabs', () => {
    const { store, calls } = setup();
    store.load();
    const before = calls.recent.length;

    store.showActivity('EXIT');

    expect(store.activityType()).toBe('EXIT');
    expect(calls.recent).toHaveLength(before + 1);
    expect(calls.recent.at(-1)?.type).toBe('EXIT');
  });

  it('skips the top products widget when the layout has none', () => {
    const { store, calls } = setup();
    store.load(false);
    expect(calls.top).toHaveLength(0);
    expect(calls.summary).toHaveLength(1);
  });
});
