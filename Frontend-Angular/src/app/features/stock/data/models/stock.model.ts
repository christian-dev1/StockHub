import { BatchStatus, DocumentType, ExpiryStatus, MovementType } from '../../domain/entities/stock';

/** Wire formats of StockResponses (BigDecimal quantities arrive as JSON numbers). */
export interface StockLevelModel {
  readonly id: string;
  readonly productId: string;
  readonly locationId: string;
  readonly sku: string;
  readonly productName: string;
  readonly quantity: number;
  readonly minStock: number | null;
  readonly lowStock: boolean;
  readonly updatedAt: string;
}

export interface StockMovementModel {
  readonly id: string;
  readonly productId: string;
  readonly locationId: string;
  readonly batchId: string | null;
  readonly documentId: string;
  readonly type: MovementType;
  readonly quantity: number;
  readonly previousQuantity: number;
  readonly newQuantity: number;
  readonly reference: string;
  readonly reason: string | null;
  readonly performedBy: string;
  readonly createdAt: string;
}

export interface BatchModel {
  readonly id: string;
  readonly productId: string;
  readonly locationId: string;
  readonly batchNumber: string;
  readonly quantity: number;
  readonly manufacturingDate: string | null;
  readonly expirationDate: string | null;
  readonly status: BatchStatus;
  readonly expiryStatus: ExpiryStatus;
}

/** Document returned by the POST operations (no lines) and by the document endpoints. */
export interface StockDocumentModel {
  readonly id: string;
  readonly type: DocumentType;
  readonly number: string;
  readonly locationId: string;
  readonly destinationLocationId: string | null;
  readonly reference: string | null;
  readonly reason: string | null;
  readonly performedBy: string;
  readonly performedByName: string;
  readonly createdAt: string;
  readonly lines?: StockMovementModel[];
}

/** Subset of ProductResponse used by the stock screens. */
export interface StockProductModel {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly unit: string;
  readonly minStock: number | null;
  readonly batchTracked: boolean;
  readonly expiryTracked: boolean;
  readonly active: boolean;
}

export interface StockLocationModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly primary: boolean;
}

export interface StockUserModel {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}
