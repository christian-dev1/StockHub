import {
  AdjustmentCommand,
  Batch,
  EntryCommand,
  ExitCommand,
  StockDocument,
  StockDocumentSummary,
  StockLevel,
  StockLocation,
  StockMovement,
  StockProduct,
  StockUser,
  TransferCommand,
} from '../../domain/entities/stock';
import {
  BatchModel,
  StockDocumentModel,
  StockLevelModel,
  StockLocationModel,
  StockMovementModel,
  StockProductModel,
  StockUserModel,
} from '../models/stock.model';

export function toStockLevel(model: StockLevelModel): StockLevel {
  return {
    id: model.id,
    productId: model.productId,
    locationId: model.locationId,
    sku: model.sku,
    productName: model.productName,
    quantity: Number(model.quantity),
    minStock: Number(model.minStock ?? 0),
    lowStock: model.lowStock,
    updatedAt: new Date(model.updatedAt),
  };
}

export function toStockMovement(model: StockMovementModel): StockMovement {
  return {
    id: model.id,
    productId: model.productId,
    locationId: model.locationId,
    batchId: model.batchId ?? null,
    documentId: model.documentId,
    type: model.type,
    quantity: Number(model.quantity),
    previousQuantity: Number(model.previousQuantity),
    newQuantity: Number(model.newQuantity),
    reference: model.reference,
    reason: model.reason ?? null,
    performedBy: model.performedBy,
    createdAt: new Date(model.createdAt),
  };
}

export function toBatch(model: BatchModel): Batch {
  return {
    id: model.id,
    productId: model.productId,
    locationId: model.locationId,
    batchNumber: model.batchNumber,
    quantity: Number(model.quantity),
    manufacturingDate: model.manufacturingDate ?? null,
    expirationDate: model.expirationDate ?? null,
    status: model.status,
    expiryStatus: model.expiryStatus,
  };
}

export function toStockDocumentSummary(model: StockDocumentModel): StockDocumentSummary {
  return {
    id: model.id,
    type: model.type,
    number: model.number,
    locationId: model.locationId,
    destinationLocationId: model.destinationLocationId ?? null,
    reference: model.reference ?? null,
    reason: model.reason ?? null,
    performedBy: model.performedBy,
    performedByName: model.performedByName,
    createdAt: new Date(model.createdAt),
  };
}

export function toStockDocument(model: StockDocumentModel): StockDocument {
  return { ...toStockDocumentSummary(model), lines: (model.lines ?? []).map(toStockMovement) };
}

export function toStockProduct(model: StockProductModel): StockProduct {
  return {
    id: model.id,
    sku: model.sku,
    name: model.name,
    unit: model.unit,
    minStock: Number(model.minStock ?? 0),
    batchTracked: model.batchTracked,
    expiryTracked: model.expiryTracked,
    active: model.active,
  };
}

export function toStockLocation(model: StockLocationModel): StockLocation {
  return { id: model.id, code: model.code, name: model.name, primary: model.primary };
}

export function toStockUser(model: StockUserModel): StockUser {
  return { id: model.id, name: `${model.firstName} ${model.lastName}`.trim() };
}

/** Blank optional texts are left out so that the backend stores null. */
function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function toEntryRequest(command: EntryCommand): Record<string, unknown> {
  const line: Record<string, unknown> = {
    productId: command.productId,
    quantity: command.quantity,
  };
  if (command.batch) {
    line['batchNumber'] = command.batch.batchNumber;
    line['manufacturingDate'] = command.batch.manufacturingDate;
    line['expirationDate'] = command.batch.expirationDate;
  }
  return {
    locationId: command.locationId,
    reason: optional(command.reason),
    reference: optional(command.reference),
    lines: [line],
  };
}

export function toExitRequest(command: ExitCommand): Record<string, unknown> {
  return {
    locationId: command.locationId,
    reason: optional(command.reason),
    reference: optional(command.reference),
    lines: [{ productId: command.productId, quantity: command.quantity }],
  };
}

export function toAdjustmentRequest(command: AdjustmentCommand): Record<string, unknown> {
  return {
    locationId: command.locationId,
    productId: command.productId,
    batchId: command.batchId,
    countedQuantity: command.countedQuantity,
    reason: command.reason.trim(),
  };
}

export function toTransferRequest(command: TransferCommand): Record<string, unknown> {
  return {
    sourceLocationId: command.sourceLocationId,
    destinationLocationId: command.destinationLocationId,
    reason: optional(command.reason),
    reference: optional(command.reference),
    lines: [{ productId: command.productId, quantity: command.quantity }],
  };
}
