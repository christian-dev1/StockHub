/**
 * Wire formats of the dashboard endpoints. The backend omits null fields, so
 * every nullable value is optional here; BigDecimal values arrive as numbers.
 */
export interface PeriodModel {
  readonly code: string;
  readonly from: string;
  readonly to: string;
  readonly granularity: string;
}

export interface LocationRefModel {
  readonly id: string;
  readonly name: string;
}

export interface OperationCountsModel {
  readonly entries: number;
  readonly exits: number;
  readonly transfers: number;
  readonly adjustments: number;
  readonly entryQuantity?: number;
  readonly exitQuantity?: number;
}

export interface LevelAlertModel {
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly quantity: number;
  readonly minStock?: number;
}

export interface BatchAlertModel {
  readonly batchId: string;
  readonly productId: string;
  readonly productName: string;
  readonly batchNumber: string;
  readonly expirationDate: string;
  readonly quantity: number;
  readonly locationId: string;
  readonly locationName: string;
}

export interface SummaryModel {
  readonly period: PeriodModel;
  readonly scope: {
    readonly locationId?: string;
    readonly locations?: LocationRefModel[];
    readonly multiLocation: boolean;
    readonly financial: boolean;
  };
  readonly catalogue: {
    readonly activeProducts: number;
    readonly referencesInStock: number;
    readonly totalQuantity?: number;
    readonly stockValue?: number;
    readonly currency: string;
  };
  readonly status: { normal: number; low: number; out: number; negative: number };
  readonly batches: {
    expired: number;
    expiringWithin7Days: number;
    expiringSoon: number;
    warningDays: number;
  };
  readonly activity: { today: OperationCountsModel; period: OperationCountsModel };
  readonly byLocation?: {
    locationId: string;
    name: string;
    stockValue?: number;
    referencesInStock: number;
    quantity?: number;
  }[];
  readonly attention: {
    outOfStock?: LevelAlertModel[];
    lowStock?: LevelAlertModel[];
    expiredBatches?: BatchAlertModel[];
    expiringBatches?: BatchAlertModel[];
  };
}

export interface StockFlowModel {
  readonly period: PeriodModel;
  readonly points: {
    bucket: string;
    entries: number;
    exits: number;
    entryQuantity?: number;
    exitQuantity?: number;
  }[];
}

export interface RecentOperationModel {
  readonly documentId: string;
  readonly type: string;
  readonly number: string;
  readonly createdAt: string;
  readonly performedByName: string;
  readonly location: LocationRefModel;
  readonly destination?: LocationRefModel;
  readonly productId?: string;
  readonly productName?: string;
  readonly sku?: string;
  readonly otherProducts?: number;
  readonly quantity?: number;
}

export interface TopMovementsModel {
  readonly period: PeriodModel;
  readonly products: {
    productId: string;
    name: string;
    sku: string;
    unit: string;
    operations: number;
    enteredQuantity?: number;
    exitedQuantity?: number;
  }[];
}

export interface PlatformDashboardModel {
  readonly period: PeriodModel;
  readonly totals: {
    companies: number;
    activeCompanies: number;
    disabledCompanies: number;
    users: number;
    activeUsers: number;
    products: number;
    locations: number;
    operationsToday: number;
  };
  readonly activity: { bucket: string; newCompanies: number; operations: number }[];
  readonly recentEvents: {
    id: string;
    occurredAt: string;
    action: string;
    actor?: string;
    companyName?: string;
  }[];
}
