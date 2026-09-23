import {
  PAYMENT_METHODS,
  type PaymentMethod,
  type Sale,
  type SaleListItem,
  type SaleSettings,
  type SaleTotals,
  type SellerSummary,
} from '../../domain/entities/sale';
import type {
  SaleListItemModel,
  SaleModel,
  SaleSettingsModel,
  SellerSummaryModel,
  TotalsModel,
} from '../models/sale.model';

function paymentMethod(value: string): PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value) ? (value as PaymentMethod) : 'OTHER';
}

export function toSale(model: SaleModel): Sale {
  return {
    id: model.id,
    number: model.number,
    status: model.status,
    locationId: model.locationId,
    locationName: model.locationName,
    sellerName: model.sellerName,
    customerName: model.customerName ?? null,
    paymentMethod: paymentMethod(model.paymentMethod),
    currency: model.currency,
    totalAmount: Number(model.totalAmount),
    createdAt: new Date(model.createdAt),
    lines: model.lines.map((line) => ({
      position: line.position,
      productId: line.productId,
      productName: line.productName,
      sku: line.sku,
      unit: line.unit,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      lineTotal: Number(line.lineTotal),
    })),
  };
}

export function toSaleListItem(model: SaleListItemModel): SaleListItem {
  return {
    id: model.id,
    number: model.number,
    status: model.status,
    locationName: model.locationName,
    sellerName: model.sellerName,
    customerName: model.customerName ?? null,
    paymentMethod: paymentMethod(model.paymentMethod),
    currency: model.currency,
    totalAmount: Number(model.totalAmount),
    itemCount: model.itemCount,
    createdAt: new Date(model.createdAt),
  };
}

function toTotals(model: TotalsModel): SaleTotals {
  return {
    salesCount: model.salesCount,
    revenue: Number(model.revenue),
    averageBasket: Number(model.averageBasket),
  };
}

export function toSellerSummary(model: SellerSummaryModel): SellerSummary {
  return {
    currency: model.currency,
    days: model.days,
    today: toTotals(model.today),
    lastDays: toTotals(model.lastDays),
    topProducts: model.topProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      sku: p.sku,
      quantity: Number(p.quantity),
      revenue: Number(p.revenue),
    })),
    recentSales: model.recentSales.map(toSaleListItem),
  };
}

export function toSaleSettings(model: SaleSettingsModel): SaleSettings {
  return {
    currency: model.currency,
    allowNegativeStock: model.allowNegativeStock,
    paymentMethods: model.paymentMethods
      .filter((m) => (PAYMENT_METHODS as readonly string[]).includes(m))
      .map((m) => m as PaymentMethod),
  };
}
