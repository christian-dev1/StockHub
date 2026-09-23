import { describe, expect, it } from 'vitest';
import {
  addProduct,
  canCheckout,
  cartTotal,
  itemCount,
  lineIssue,
  removeLine,
  setQuantity,
  stepQuantity,
  type CartProduct,
} from './cart';

const water: CartProduct = {
  id: 'w',
  name: 'Eau',
  sku: 'EAU',
  unit: 'UNIT',
  salePrice: 500,
  availableQuantity: 3,
};
const rice: CartProduct = {
  id: 'r',
  name: 'Riz',
  sku: 'RIZ',
  unit: 'KG',
  salePrice: 800,
  availableQuantity: 10,
};

describe('cart', () => {
  it('adds products, increments an existing line and computes the total', () => {
    let lines = addProduct([], water);
    lines = addProduct(lines, rice);
    lines = addProduct(lines, water);
    expect(lines.map((l) => [l.product.id, l.quantity])).toEqual([
      ['w', 2],
      ['r', 1],
    ]);
    expect(cartTotal(lines)).toBe(1800);
    expect(itemCount(lines)).toBe(3);
  });

  it('changes quantities with the +/- buttons without going below one', () => {
    let lines = addProduct([], water);
    lines = stepQuantity(lines, 'w', -1);
    expect(lines[0]?.quantity).toBe(1);
    lines = stepQuantity(lines, 'w', 1);
    expect(lines[0]?.quantity).toBe(2);
  });

  it('removes a line', () => {
    const lines = removeLine(addProduct(addProduct([], water), rice), 'w');
    expect(lines.map((l) => l.product.id)).toEqual(['r']);
  });

  it('flags invalid quantities and insufficient stock like the backend', () => {
    const line = addProduct([], water)[0]!;
    expect(lineIssue({ ...line, quantity: 0 }, false)).toBe('QUANTITY_INVALID');
    expect(lineIssue({ ...line, quantity: 1.5 }, false)).toBe('QUANTITY_MUST_BE_WHOLE');
    expect(lineIssue({ ...line, quantity: 4 }, false)).toBe('INSUFFICIENT_STOCK');
    expect(lineIssue({ ...line, quantity: 4 }, true)).toBeNull();
    expect(lineIssue({ product: rice, quantity: 1.25 }, false)).toBeNull();
    expect(lineIssue({ product: rice, quantity: 1.0001 }, false)).toBe('QUANTITY_INVALID');
  });

  it('only allows checkout of a non-empty, valid cart', () => {
    expect(canCheckout([], false)).toBe(false);
    const lines = addProduct([], water);
    expect(canCheckout(lines, false)).toBe(true);
    expect(canCheckout(setQuantity(lines, 'w', 9), false)).toBe(false);
  });
});
