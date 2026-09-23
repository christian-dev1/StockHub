/** Backend JSON; decimals may arrive as numbers or strings, null fields are omitted. */
type Decimal = number | string;

export interface SaleLineModel {
  readonly position: number;
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly unit: string;
  readonly quantity: Decimal;
  readonly unitPrice: Decimal;
  readonly lineTotal: Decimal;
}

export interface SaleModel {
  readonly id: string;
  readonly number: string;
  readonly status: 'COMPLETED';
  readonly locationId: string;
  readonly locationName: string;
  readonly sellerName: string;
  readonly customerName?: string;
  readonly paymentMethod: string;
  readonly currency: string;
  readonly totalAmount: Decimal;
  readonly createdAt: string;
  readonly lines: readonly SaleLineModel[];
}

export interface SaleListItemModel {
  readonly id: string;
  readonly number: string;
  readonly status: 'COMPLETED';
  readonly locationName: string;
  readonly sellerName: string;
  readonly customerName?: string;
  readonly paymentMethod: string;
  readonly currency: string;
  readonly totalAmount: Decimal;
  readonly itemCount: number;
  readonly createdAt: string;
}

export interface TotalsModel {
  readonly salesCount: number;
  readonly revenue: Decimal;
  readonly averageBasket: Decimal;
}

export interface SellerSummaryModel {
  readonly currency: string;
  readonly days: number;
  readonly today: TotalsModel;
  readonly lastDays: TotalsModel;
  readonly topProducts: readonly {
    readonly productId: string;
    readonly productName: string;
    readonly sku: string;
    readonly quantity: Decimal;
    readonly revenue: Decimal;
  }[];
  readonly recentSales: readonly SaleListItemModel[];
}

export interface SaleSettingsModel {
  readonly currency: string;
  readonly allowNegativeStock: boolean;
  readonly paymentMethods: readonly string[];
}
