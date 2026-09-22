import {
  DashboardFilters,
  DashboardPeriod,
  DashboardSummary,
  Granularity,
  OperationCounts,
  OperationType,
  PeriodCode,
  PlatformDashboard,
  RecentOperation,
  StockFlow,
  TopMovements,
} from '../../domain/entities/dashboard';
import {
  OperationCountsModel,
  PeriodModel,
  PlatformDashboardModel,
  RecentOperationModel,
  StockFlowModel,
  SummaryModel,
  TopMovementsModel,
} from '../models/dashboard.model';

const num = (value: number | undefined | null): number => Number(value ?? 0);

/** Query parameters of the company endpoints; custom days only for a custom period. */
export function toDashboardParams(filters: DashboardFilters): Record<string, string> {
  const params: Record<string, string> = { period: filters.period };
  if (filters.period === 'CUSTOM') {
    if (filters.from) params['from'] = filters.from;
    if (filters.to) params['to'] = filters.to;
  }
  if (filters.locationId) params['locationId'] = filters.locationId;
  return params;
}

export function toPeriod(model: PeriodModel): DashboardPeriod {
  return {
    code: model.code as PeriodCode,
    from: model.from,
    to: model.to,
    granularity: model.granularity as Granularity,
  };
}

function toCounts(model: OperationCountsModel): OperationCounts {
  return {
    entries: num(model.entries),
    exits: num(model.exits),
    transfers: num(model.transfers),
    adjustments: num(model.adjustments),
    entryQuantity: num(model.entryQuantity),
    exitQuantity: num(model.exitQuantity),
  };
}

export function toSummary(model: SummaryModel): DashboardSummary {
  const attention = model.attention ?? {};
  return {
    period: toPeriod(model.period),
    scope: {
      locationId: model.scope.locationId ?? null,
      locations: model.scope.locations ?? [],
      multiLocation: model.scope.multiLocation,
      financial: model.scope.financial,
    },
    catalogue: {
      activeProducts: num(model.catalogue.activeProducts),
      referencesInStock: num(model.catalogue.referencesInStock),
      totalQuantity: num(model.catalogue.totalQuantity),
      stockValue:
        model.catalogue.stockValue === undefined || model.catalogue.stockValue === null
          ? null
          : Number(model.catalogue.stockValue),
      currency: model.catalogue.currency,
    },
    status: {
      normal: num(model.status.normal),
      low: num(model.status.low),
      out: num(model.status.out),
      negative: num(model.status.negative),
    },
    batches: { ...model.batches },
    activity: { today: toCounts(model.activity.today), period: toCounts(model.activity.period) },
    byLocation: (model.byLocation ?? []).map((l) => ({
      locationId: l.locationId,
      name: l.name,
      stockValue: l.stockValue === undefined || l.stockValue === null ? null : Number(l.stockValue),
      referencesInStock: num(l.referencesInStock),
      quantity: num(l.quantity),
    })),
    attention: {
      outOfStock: (attention.outOfStock ?? []).map((a) => ({
        ...a,
        quantity: num(a.quantity),
        minStock: num(a.minStock),
      })),
      lowStock: (attention.lowStock ?? []).map((a) => ({
        ...a,
        quantity: num(a.quantity),
        minStock: num(a.minStock),
      })),
      expiredBatches: (attention.expiredBatches ?? []).map((b) => ({
        ...b,
        quantity: num(b.quantity),
      })),
      expiringBatches: (attention.expiringBatches ?? []).map((b) => ({
        ...b,
        quantity: num(b.quantity),
      })),
    },
  };
}

export function toStockFlow(model: StockFlowModel): StockFlow {
  return {
    period: toPeriod(model.period),
    points: model.points.map((p) => ({
      bucket: p.bucket,
      entries: num(p.entries),
      exits: num(p.exits),
      entryQuantity: num(p.entryQuantity),
      exitQuantity: num(p.exitQuantity),
    })),
  };
}

export function toRecentOperation(model: RecentOperationModel): RecentOperation {
  return {
    documentId: model.documentId,
    type: model.type as OperationType,
    number: model.number,
    createdAt: new Date(model.createdAt),
    performedByName: model.performedByName,
    location: model.location,
    destination: model.destination ?? null,
    productId: model.productId ?? null,
    productName: model.productName ?? null,
    sku: model.sku ?? null,
    otherProducts: num(model.otherProducts),
    quantity: num(model.quantity),
  };
}

export function toTopMovements(model: TopMovementsModel): TopMovements {
  return {
    period: toPeriod(model.period),
    products: model.products.map((p) => ({
      ...p,
      operations: num(p.operations),
      enteredQuantity: num(p.enteredQuantity),
      exitedQuantity: num(p.exitedQuantity),
    })),
  };
}

export function toPlatformDashboard(model: PlatformDashboardModel): PlatformDashboard {
  return {
    period: toPeriod(model.period),
    totals: { ...model.totals },
    activity: model.activity.map((a) => ({ ...a })),
    recentEvents: model.recentEvents.map((e) => ({
      id: e.id,
      occurredAt: new Date(e.occurredAt),
      action: e.action,
      actor: e.actor ?? null,
      companyName: e.companyName ?? null,
    })),
  };
}
