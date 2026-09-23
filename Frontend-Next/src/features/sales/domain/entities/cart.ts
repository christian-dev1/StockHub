import { DISCRETE_UNITS, type SellableProduct } from '@/features/catalogue/domain/entities/sellable-product';

export type CartProduct = Pick<
  SellableProduct,
  'id' | 'name' | 'sku' | 'unit' | 'salePrice' | 'availableQuantity'
>;

export interface CartLine {
  readonly product: CartProduct;
  readonly quantity: number;
}

export type LineIssue = 'QUANTITY_INVALID' | 'QUANTITY_MUST_BE_WHOLE' | 'INSUFFICIENT_STOCK';

/** Adds one unit, or appends the product (latest availability kept). */
export function addProduct(lines: readonly CartLine[], product: CartProduct): CartLine[] {
  const existing = lines.find((line) => line.product.id === product.id);
  if (!existing) return [...lines, { product, quantity: 1 }];
  return lines.map((line) =>
    line.product.id === product.id ? { product, quantity: roundQuantity(line.quantity + 1) } : line,
  );
}

export function setQuantity(lines: readonly CartLine[], productId: string, quantity: number): CartLine[] {
  return lines.map((line) => (line.product.id === productId ? { ...line, quantity } : line));
}

/** +1 / -1 buttons; never goes below 1 (removing is an explicit action). */
export function stepQuantity(lines: readonly CartLine[], productId: string, delta: 1 | -1): CartLine[] {
  return lines.map((line) =>
    line.product.id === productId
      ? { ...line, quantity: Math.max(1, roundQuantity(Math.floor(line.quantity) + delta)) }
      : line,
  );
}

/** Replaces product data (price, availability) with fresher values, quantities unchanged. */
export function refreshProducts(lines: readonly CartLine[], products: readonly CartProduct[]): CartLine[] {
  return lines.map((line) => ({
    ...line,
    product: products.find((p) => p.id === line.product.id) ?? line.product,
  }));
}

export function removeLine(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.product.id !== productId);
}

/** Indicative total shown while selling; the server computes the real one. */
export function lineTotal(line: CartLine): number {
  return roundAmount(line.product.salePrice * line.quantity);
}

export function cartTotal(lines: readonly CartLine[]): number {
  return roundAmount(lines.reduce((sum, line) => sum + lineTotal(line), 0));
}

export function itemCount(lines: readonly CartLine[]): number {
  return roundQuantity(lines.reduce((sum, line) => sum + line.quantity, 0));
}

/** Same checks as the backend, so that the seller sees problems before confirming. */
export function lineIssue(line: CartLine, allowNegativeStock: boolean): LineIssue | null {
  const q = line.quantity;
  if (!Number.isFinite(q) || q <= 0 || decimals(q) > 3) return 'QUANTITY_INVALID';
  if (DISCRETE_UNITS.includes(line.product.unit) && !Number.isInteger(q)) return 'QUANTITY_MUST_BE_WHOLE';
  if (!allowNegativeStock && q > line.product.availableQuantity) return 'INSUFFICIENT_STOCK';
  return null;
}

export function canCheckout(lines: readonly CartLine[], allowNegativeStock: boolean): boolean {
  return lines.length > 0 && lines.every((line) => lineIssue(line, allowNegativeStock) === null);
}

function decimals(value: number): number {
  const text = String(value);
  return text.includes('.') ? (text.split('.')[1] ?? '').length : 0;
}

function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundAmount(value: number): number {
  return Math.round(value * 10000) / 10000;
}
