export const PAYMENT_METHODS = ['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type SaleStatus = 'COMPLETED';

export interface SaleLine {
  readonly position: number;
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unit: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
}

/** A recorded sale, with what its receipt shows (all amounts computed by the server). */
export interface Sale {
  readonly id: string;
  readonly number: string;
  readonly status: SaleStatus;
  readonly locationId: string;
  readonly locationName: string;
  readonly sellerName: string;
  readonly customerName: string | null;
  readonly paymentMethod: PaymentMethod;
  readonly currency: string;
  readonly totalAmount: number;
  readonly createdAt: Date;
  readonly lines: readonly SaleLine[];
}

export interface SaleListItem {
  readonly id: string;
  readonly number: string;
  readonly status: SaleStatus;
  readonly locationName: string;
  readonly sellerName: string;
  readonly customerName: string | null;
  readonly paymentMethod: PaymentMethod;
  readonly currency: string;
  readonly totalAmount: number;
  readonly itemCount: number;
  readonly createdAt: Date;
}

export interface SalesQuery {
  readonly search?: string;
  /** ISO days, inclusive, in the company time zone. */
  readonly from?: string;
  readonly to?: string;
  readonly paymentMethod?: PaymentMethod;
  readonly page?: number;
  readonly size?: number;
}

export interface SaleTotals {
  readonly salesCount: number;
  readonly revenue: number;
  readonly averageBasket: number;
}

export interface SellerSummary {
  readonly currency: string;
  readonly days: number;
  readonly today: SaleTotals;
  readonly lastDays: SaleTotals;
  readonly topProducts: readonly {
    readonly productId: string;
    readonly productName: string;
    readonly sku: string;
    readonly quantity: number;
    readonly revenue: number;
  }[];
  readonly recentSales: readonly SaleListItem[];
}

/** Company rules of the point of sale (read-only for sellers). */
export interface SaleSettings {
  readonly currency: string;
  readonly allowNegativeStock: boolean;
  readonly paymentMethods: readonly PaymentMethod[];
}

/** What is sent: products and quantities only, the server prices the sale. */
export interface NewSale {
  readonly locationId: string;
  readonly customerName: string | null;
  readonly paymentMethod: PaymentMethod;
  readonly lines: readonly { readonly productId: string; readonly quantity: number }[];
}
