import {
  OperationCountsModel,
  PeriodModel,
  PlatformDashboardModel,
  RecentOperationModel,
  StockFlowModel,
  SummaryModel,
  TopMovementsModel,
} from '../models/dashboard.model';
import {
  toDashboardParams,
  toPeriod,
  toPlatformDashboard,
  toRecentOperation,
  toStockFlow,
  toSummary,
  toTopMovements,
} from './dashboard.mapper';
import { DEFAULT_FILTERS } from '../../domain/entities/dashboard';

const PERIOD: PeriodModel = {
  code: '30D',
  from: '2026-08-24',
  to: '2026-09-22',
  granularity: 'DAY',
};

const COUNTS: OperationCountsModel = {
  entries: 2,
  exits: 1,
  transfers: 0,
  adjustments: 0,
  entryQuantity: 30,
  exitQuantity: 5,
};

function summaryModel(overrides: Partial<SummaryModel> = {}): SummaryModel {
  return {
    period: PERIOD,
    scope: { locations: [], multiLocation: false, financial: true },
    catalogue: {
      activeProducts: 4,
      referencesInStock: 3,
      totalQuantity: 29,
      stockValue: 2020,
      currency: 'XAF',
    },
    status: { normal: 2, low: 1, out: 1, negative: 0 },
    batches: { expired: 1, expiringWithin7Days: 0, expiringSoon: 2, warningDays: 30 },
    activity: { today: COUNTS, period: COUNTS },
    attention: {},
    ...overrides,
  };
}

describe('toDashboardParams', () => {
  it('sends only the period code for a preset', () => {
    expect(toDashboardParams({ ...DEFAULT_FILTERS, period: '7D' })).toEqual({ period: '7D' });
  });

  it('adds the days of a custom period, only once both are set', () => {
    expect(
      toDashboardParams({
        period: 'CUSTOM',
        from: '2026-09-01',
        to: '2026-09-22',
        locationId: null,
      }),
    ).toEqual({ period: 'CUSTOM', from: '2026-09-01', to: '2026-09-22' });
    expect(
      toDashboardParams({ period: 'CUSTOM', from: '2026-09-01', to: null, locationId: null }),
    ).toEqual({
      period: 'CUSTOM',
      from: '2026-09-01',
    });
  });

  it('never sends an empty location', () => {
    expect(toDashboardParams({ ...DEFAULT_FILTERS, locationId: null })).not.toHaveProperty(
      'locationId',
    );
    expect(toDashboardParams({ ...DEFAULT_FILTERS, locationId: 'l1' })).toEqual({
      period: '30D',
      locationId: 'l1',
    });
  });
});

describe('toSummary', () => {
  it('maps every figure', () => {
    const summary = toSummary(summaryModel());
    expect(summary.catalogue).toEqual({
      activeProducts: 4,
      referencesInStock: 3,
      totalQuantity: 29,
      stockValue: 2020,
      currency: 'XAF',
    });
    expect(summary.status).toEqual({ normal: 2, low: 1, out: 1, negative: 0 });
    expect(summary.activity.period.entries).toBe(2);
    expect(summary.period.granularity).toBe('DAY');
  });

  it('keeps a null stock value when the role may not see it', () => {
    const summary = toSummary(
      summaryModel({
        scope: { locations: [], multiLocation: false, financial: false },
        catalogue: { activeProducts: 4, referencesInStock: 3, totalQuantity: 29, currency: 'XAF' },
      }),
    );
    expect(summary.scope.financial).toBe(false);
    expect(summary.catalogue.stockValue).toBeNull();
  });

  it('defaults absent counts to zero and tolerates empty attention lists', () => {
    const summary = toSummary(summaryModel({ activity: { today: {}, period: {} } as never }));
    expect(summary.activity.today).toEqual({
      entries: 0,
      exits: 0,
      transfers: 0,
      adjustments: 0,
      entryQuantity: 0,
      exitQuantity: 0,
    });
    expect(summary.attention).toEqual({
      outOfStock: [],
      lowStock: [],
      expiredBatches: [],
      expiringBatches: [],
    });
    expect(summary.byLocation).toEqual([]);
  });

  it('keeps a location without a computable stock value at null', () => {
    const summary = toSummary(
      summaryModel({
        byLocation: [{ locationId: 'l1', name: 'Boutique', referencesInStock: 2, quantity: 12 }],
      }),
    );
    expect(summary.byLocation[0].stockValue).toBeNull();
    expect(summary.byLocation[0].quantity).toBe(12);
  });
});

describe('flow, activity, top movements and platform', () => {
  it('maps a stock flow and numeric buckets', () => {
    const model: StockFlowModel = {
      period: PERIOD,
      points: [{ bucket: '2026-09-22T00:00:00', entries: 6, exits: 3 }],
    };
    const flow = toStockFlow(model);
    expect(flow.points).toEqual([
      { bucket: '2026-09-22T00:00:00', entries: 6, exits: 3, entryQuantity: 0, exitQuantity: 0 },
    ]);
  });

  it('maps a recent operation, dropping an absent destination', () => {
    const model: RecentOperationModel = {
      documentId: 'd1',
      type: 'ENTRY',
      number: 'BE-1',
      createdAt: '2026-09-22T10:43:00Z',
      performedByName: 'Jean Dupont',
      location: { id: 'l1', name: 'Entrepôt' },
    };
    const operation = toRecentOperation(model);
    expect(operation.createdAt).toEqual(new Date('2026-09-22T10:43:00Z'));
    expect(operation.destination).toBeNull();
    expect(operation.quantity).toBe(0);
    expect(operation.type).toBe('ENTRY');
  });

  it('maps moved products, counting absent quantities as zero', () => {
    const model: TopMovementsModel = {
      period: PERIOD,
      products: [
        {
          productId: 'p1',
          name: 'Coca-Cola',
          sku: 'CC',
          unit: 'UNIT',
          operations: 3,
          enteredQuantity: 20,
        },
      ],
    };
    const top = toTopMovements(model);
    expect(top.products[0].enteredQuantity).toBe(20);
    expect(top.products[0].exitedQuantity).toBe(0);
  });

  it('maps the platform dashboard and parses instants', () => {
    const model: PlatformDashboardModel = {
      period: PERIOD,
      totals: {
        companies: 2,
        activeCompanies: 2,
        disabledCompanies: 0,
        users: 5,
        activeUsers: 5,
        products: 10,
        locations: 3,
        operationsToday: 12,
      },
      activity: [{ bucket: '2026-09-22T00:00:00', newCompanies: 1, operations: 4 }],
      recentEvents: [{ id: 'e1', occurredAt: '2026-09-22T09:00:00Z', action: 'COMPANY_CREATED' }],
    };
    const dashboard = toPlatformDashboard(model);
    expect(dashboard.totals.companies).toBe(2);
    expect(dashboard.activity[0].newCompanies).toBe(1);
    expect(dashboard.recentEvents[0].occurredAt).toEqual(new Date('2026-09-22T09:00:00Z'));
    expect(dashboard.recentEvents[0].actor).toBeNull();
    expect(dashboard.recentEvents[0].companyName).toBeNull();
  });
});

describe('toPeriod', () => {
  it('copies the bounds and the granularity', () => {
    expect(toPeriod(PERIOD)).toEqual({
      code: '30D',
      from: '2026-08-24',
      to: '2026-09-22',
      granularity: 'DAY',
    });
  });
});
