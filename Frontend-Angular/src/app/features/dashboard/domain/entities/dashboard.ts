import { Permission, RoleCode } from '../../../../core/config/permissions/permissions';

export const PERIOD_CODES = ['TODAY', '7D', '30D', '3M', '1Y', 'CUSTOM'] as const;
export type PeriodCode = (typeof PERIOD_CODES)[number];
export type Granularity = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

/** Filters shared by every company widget. Custom days are YYYY-MM-DD, company time zone. */
export interface DashboardFilters {
  readonly period: PeriodCode;
  readonly from: string | null;
  readonly to: string | null;
  readonly locationId: string | null;
}

export const DEFAULT_FILTERS: DashboardFilters = {
  period: '30D',
  from: null,
  to: null,
  locationId: null,
};

export interface DashboardPeriod {
  readonly code: PeriodCode;
  readonly from: string;
  readonly to: string;
  readonly granularity: Granularity;
}

export interface LocationRef {
  readonly id: string;
  readonly name: string;
}

export interface OperationCounts {
  readonly entries: number;
  readonly exits: number;
  readonly transfers: number;
  readonly adjustments: number;
  readonly entryQuantity: number;
  readonly exitQuantity: number;
}

export interface LevelAlert {
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly locationId: string;
  readonly locationName: string;
  readonly quantity: number;
  readonly minStock: number;
}

export interface BatchAlert {
  readonly batchId: string;
  readonly productId: string;
  readonly productName: string;
  readonly batchNumber: string;
  readonly expirationDate: string;
  readonly quantity: number;
  readonly locationId: string;
  readonly locationName: string;
}

export interface LocationStock {
  readonly locationId: string;
  readonly name: string;
  /** Null when the user may not see stock values. */
  readonly stockValue: number | null;
  readonly referencesInStock: number;
  readonly quantity: number;
}

export interface DashboardSummary {
  readonly period: DashboardPeriod;
  readonly scope: {
    readonly locationId: string | null;
    readonly locations: readonly LocationRef[];
    readonly multiLocation: boolean;
    /** The backend computed stock values (STOCK_VALUE_VIEW). */
    readonly financial: boolean;
  };
  readonly catalogue: {
    readonly activeProducts: number;
    readonly referencesInStock: number;
    readonly totalQuantity: number;
    readonly stockValue: number | null;
    readonly currency: string;
  };
  readonly status: {
    readonly normal: number;
    readonly low: number;
    readonly out: number;
    readonly negative: number;
  };
  readonly batches: {
    readonly expired: number;
    readonly expiringWithin7Days: number;
    readonly expiringSoon: number;
    readonly warningDays: number;
  };
  readonly activity: { readonly today: OperationCounts; readonly period: OperationCounts };
  readonly byLocation: readonly LocationStock[];
  readonly attention: {
    readonly outOfStock: readonly LevelAlert[];
    readonly lowStock: readonly LevelAlert[];
    readonly expiredBatches: readonly BatchAlert[];
    readonly expiringBatches: readonly BatchAlert[];
  };
}

/** One chart bucket; `bucket` is a local date-time of the company (no zone). */
export interface FlowPoint {
  readonly bucket: string;
  readonly entries: number;
  readonly exits: number;
  readonly entryQuantity: number;
  readonly exitQuantity: number;
}

export interface StockFlow {
  readonly period: DashboardPeriod;
  readonly points: readonly FlowPoint[];
}

export type OperationType = 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT';

export interface RecentOperation {
  readonly documentId: string;
  readonly type: OperationType;
  readonly number: string;
  readonly createdAt: Date;
  readonly performedByName: string;
  readonly location: LocationRef;
  readonly destination: LocationRef | null;
  readonly productId: string | null;
  readonly productName: string | null;
  readonly sku: string | null;
  readonly otherProducts: number;
  /** Signed for entries, exits and adjustments; the moved quantity for transfers. */
  readonly quantity: number;
}

export interface MovedProduct {
  readonly productId: string;
  readonly name: string;
  readonly sku: string;
  readonly unit: string;
  readonly operations: number;
  readonly enteredQuantity: number;
  readonly exitedQuantity: number;
}

export interface TopMovements {
  readonly period: DashboardPeriod;
  readonly products: readonly MovedProduct[];
}

export interface PlatformDashboard {
  readonly period: DashboardPeriod;
  readonly totals: {
    readonly companies: number;
    readonly activeCompanies: number;
    readonly disabledCompanies: number;
    readonly users: number;
    readonly activeUsers: number;
    readonly products: number;
    readonly locations: number;
    readonly operationsToday: number;
  };
  readonly activity: readonly { bucket: string; newCompanies: number; operations: number }[];
  readonly recentEvents: readonly {
    readonly id: string;
    readonly occurredAt: Date;
    readonly action: string;
    readonly actor: string | null;
    readonly companyName: string | null;
  }[];
}

/**
 * Which dashboard a user gets. The backend decides what data exists (e.g. no
 * stock value without STOCK_VALUE_VIEW); this only picks the layout.
 */
export type DashboardVariant = 'platform' | 'business' | 'operations';

export function dashboardVariant(
  role: RoleCode | undefined,
  can: (permission: Permission) => boolean,
): DashboardVariant {
  if (role === 'SUPER_ADMIN') return 'platform';
  return can('STOCK_VALUE_VIEW') ? 'business' : 'operations';
}

/** Share of each stock state, for the status bar (0–100, summing to 100 when not empty). */
export function statusShares(status: DashboardSummary['status']): {
  readonly normal: number;
  readonly low: number;
  readonly out: number;
  readonly total: number;
} {
  const total = status.normal + status.low + status.out;
  if (total === 0) return { normal: 0, low: 0, out: 0, total };
  const pct = (value: number) => Math.round((value / total) * 1000) / 10;
  return { normal: pct(status.normal), low: pct(status.low), out: pct(status.out), total };
}
