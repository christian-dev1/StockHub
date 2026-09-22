import { Permission } from '../../../../core/config/permissions/permissions';

/** Kinds of stock change, as exposed by the backend ledger. */
export const MOVEMENT_TYPES = [
  'ENTRY',
  'EXIT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT_POSITIVE',
  'ADJUSTMENT_NEGATIVE',
  'RETURN_CUSTOMER',
  'RETURN_SUPPLIER',
  'SALE',
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

const INCREASING: ReadonlySet<MovementType> = new Set([
  'ENTRY',
  'TRANSFER_IN',
  'ADJUSTMENT_POSITIVE',
  'RETURN_CUSTOMER',
]);

/** True when the movement added stock to its location (same rule as the backend enum). */
export function increases(type: MovementType): boolean {
  return INCREASING.has(type);
}

/** Stock notes; their number starts with BE, BS, AJ or TR. */
export const DOCUMENT_TYPES = ['ENTRY', 'EXIT', 'ADJUSTMENT', 'TRANSFER'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const EXPIRY_STATUSES = ['VALID', 'EXPIRING_SOON', 'EXPIRED'] as const;
export type ExpiryStatus = (typeof EXPIRY_STATUSES)[number];

/** Quantity status of a batch: DEPLETED once everything has left it. */
export type BatchStatus = 'ACTIVE' | 'DEPLETED';

/** Quantity of one product in one location. */
export interface StockLevel {
  readonly id: string;
  readonly productId: string;
  readonly locationId: string;
  readonly sku: string;
  readonly productName: string;
  readonly quantity: number;
  readonly minStock: number;
  readonly lowStock: boolean;
  readonly updatedAt: Date;
}

/** Visual state of a stock level, from the most to the least urgent. */
export type LevelState = 'NEGATIVE' | 'OUT' | 'LOW' | 'IN_STOCK';

/**
 * Zero is "out of stock" even when a minimum is set; `lowStock` comes from the
 * backend (quantity at or below a minimum above zero).
 */
export function levelState(level: Pick<StockLevel, 'quantity' | 'lowStock'>): LevelState {
  if (level.quantity < 0) return 'NEGATIVE';
  if (level.quantity === 0) return 'OUT';
  return level.lowStock ? 'LOW' : 'IN_STOCK';
}

/** Immutable line of the stock ledger. Quantities are strictly positive; the type gives the sign. */
export interface StockMovement {
  readonly id: string;
  readonly productId: string;
  readonly locationId: string;
  readonly batchId: string | null;
  readonly documentId: string;
  readonly type: MovementType;
  readonly quantity: number;
  readonly previousQuantity: number;
  readonly newQuantity: number;
  /** Number of the stock note (BE-2026-000001…). */
  readonly reference: string;
  readonly reason: string | null;
  readonly performedBy: string;
  readonly createdAt: Date;
}

/** Quantity with its sign: +20 for an entry, -5 for an exit. */
export function signedQuantity(movement: Pick<StockMovement, 'type' | 'quantity'>): number {
  return increases(movement.type) ? movement.quantity : -movement.quantity;
}

export interface Batch {
  readonly id: string;
  readonly productId: string;
  readonly locationId: string;
  readonly batchNumber: string;
  readonly quantity: number;
  /** Calendar dates (YYYY-MM-DD), never shifted by time zones. */
  readonly manufacturingDate: string | null;
  readonly expirationDate: string | null;
  readonly status: BatchStatus;
  readonly expiryStatus: ExpiryStatus;
}

/** Stock note header, as returned right after an operation. */
export interface StockDocumentSummary {
  readonly id: string;
  readonly type: DocumentType;
  readonly number: string;
  readonly locationId: string;
  readonly destinationLocationId: string | null;
  /** External reference given by the user (supplier delivery note…). */
  readonly reference: string | null;
  readonly reason: string | null;
  readonly performedBy: string;
  readonly performedByName: string;
  readonly createdAt: Date;
}

/** Stock note with its lines: one movement per product, batch and location affected. */
export interface StockDocument extends StockDocumentSummary {
  readonly lines: readonly StockMovement[];
}

/** Before/after quantities of a location touched by a document. */
export interface LocationBalance {
  readonly locationId: string;
  readonly before: number;
  readonly after: number;
}

/**
 * Balance of each location in a document. A batch-tracked product produces
 * one line per batch, each with the level around it, so the balance spans the
 * extreme values of its lines.
 */
export function locationBalances(lines: readonly StockMovement[]): LocationBalance[] {
  const balances = new Map<string, LocationBalance>();
  for (const line of lines) {
    const up = increases(line.type);
    const current = balances.get(line.locationId);
    balances.set(line.locationId, {
      locationId: line.locationId,
      before: current
        ? up
          ? Math.min(current.before, line.previousQuantity)
          : Math.max(current.before, line.previousQuantity)
        : line.previousQuantity,
      after: current
        ? up
          ? Math.max(current.after, line.newQuantity)
          : Math.min(current.after, line.newQuantity)
        : line.newQuantity,
    });
  }
  return [...balances.values()];
}

// ----- Filters -----

export type LevelStateFilter = 'LOW' | 'OUT' | null;

export interface LevelFilters {
  readonly search: string;
  readonly locationId: string | null;
  readonly state: LevelStateFilter;
}

export const EMPTY_LEVEL_FILTERS: LevelFilters = { search: '', locationId: null, state: null };

export interface MovementFilters {
  readonly locationId: string | null;
  readonly productId: string | null;
  readonly type: MovementType | null;
  readonly performedBy: string | null;
  readonly reference: string;
  /** Calendar days (YYYY-MM-DD), both included, in the company time zone. */
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
}

export const EMPTY_MOVEMENT_FILTERS: MovementFilters = {
  locationId: null,
  productId: null,
  type: null,
  performedBy: null,
  reference: '',
  dateFrom: null,
  dateTo: null,
};

export interface BatchFilters {
  readonly batchNumber: string;
  readonly productId: string | null;
  readonly locationId: string | null;
  readonly status: ExpiryStatus | null;
  /** Expiration dates (YYYY-MM-DD), both included. */
  readonly expirationFrom: string | null;
  readonly expirationTo: string | null;
}

export const EMPTY_BATCH_FILTERS: BatchFilters = {
  batchNumber: '',
  productId: null,
  locationId: null,
  status: null,
  expirationFrom: null,
  expirationTo: null,
};

export interface DocumentFilters {
  readonly type: DocumentType | null;
  readonly locationId: string | null;
  readonly reference: string;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
}

export const EMPTY_DOCUMENT_FILTERS: DocumentFilters = {
  type: null,
  locationId: null,
  reference: '',
  dateFrom: null,
  dateTo: null,
};

// ----- Operations -----

export type StockOperation = 'entry' | 'exit' | 'adjustment' | 'transfer';

export const STOCK_OPERATIONS: readonly StockOperation[] = [
  'entry',
  'exit',
  'transfer',
  'adjustment',
];

/** Backend permission of each operation (UI hint only: the backend re-checks). */
export const OPERATION_PERMISSIONS: Record<StockOperation, Permission> = {
  entry: 'STOCK_ENTRY',
  exit: 'STOCK_EXIT',
  adjustment: 'STOCK_ADJUST',
  transfer: 'STOCK_TRANSFER',
};

/** Goods received. Batch fields are sent only for batch-tracked products. */
export interface EntryCommand {
  readonly locationId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly reason: string;
  readonly reference: string;
  readonly batch: {
    readonly batchNumber: string;
    readonly manufacturingDate: string | null;
    readonly expirationDate: string | null;
  } | null;
}

/** Goods issued; the backend picks the batches (FEFO). */
export interface ExitCommand {
  readonly locationId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly reason: string;
  readonly reference: string;
}

/** Brings a level (or one batch) to the counted quantity. */
export interface AdjustmentCommand {
  readonly locationId: string;
  readonly productId: string;
  readonly batchId: string | null;
  readonly countedQuantity: number;
  readonly reason: string;
}

export interface TransferCommand {
  readonly sourceLocationId: string;
  readonly destinationLocationId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly reason: string;
  readonly reference: string;
}

export type AdjustmentDirection = 'INCREASE' | 'DECREASE';

/**
 * The backend takes the counted quantity; the form asks for a signed change,
 * which is friendlier. Rounded to the three decimals the backend accepts.
 */
export function adjustedQuantity(
  current: number,
  change: number,
  direction: AdjustmentDirection,
): number {
  const target = direction === 'INCREASE' ? current + change : current - change;
  return Math.round(target * 1000) / 1000;
}

// ----- Reference data -----

/** Catalogue data needed to fill an operation form. */
export interface StockProduct {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly unit: string;
  readonly minStock: number;
  readonly batchTracked: boolean;
  readonly expiryTracked: boolean;
  readonly active: boolean;
}

/** Units counted in whole numbers (same rule as the backend). */
export function isWholeUnit(unit: string): boolean {
  return unit === 'UNIT' || unit === 'BOX' || unit === 'PACK';
}

export interface StockUser {
  readonly id: string;
  readonly name: string;
}

export interface StockLocation {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly primary: boolean;
}
