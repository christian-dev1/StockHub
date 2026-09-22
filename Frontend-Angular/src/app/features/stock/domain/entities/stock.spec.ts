import {
  StockMovement,
  adjustedQuantity,
  increases,
  isWholeUnit,
  levelState,
  locationBalances,
  signedQuantity,
} from './stock';

const line = (partial: Partial<StockMovement>): StockMovement => ({
  id: partial.id ?? 'm',
  productId: 'p',
  locationId: 'A',
  batchId: null,
  documentId: 'd',
  type: 'EXIT',
  quantity: 1,
  previousQuantity: 0,
  newQuantity: 0,
  reference: 'BS-2026-000001',
  reason: null,
  performedBy: 'u',
  createdAt: new Date(),
  ...partial,
});

describe('stock entities', () => {
  it.each([
    [{ quantity: -2, lowStock: true }, 'NEGATIVE'],
    [{ quantity: 0, lowStock: true }, 'OUT'],
    [{ quantity: 0, lowStock: false }, 'OUT'],
    [{ quantity: 3, lowStock: true }, 'LOW'],
    [{ quantity: 30, lowStock: false }, 'IN_STOCK'],
  ] as const)('derives the state of %o', (level, state) => {
    expect(levelState(level)).toBe(state);
  });

  it('knows which movements add stock', () => {
    expect(increases('ENTRY')).toBe(true);
    expect(increases('TRANSFER_IN')).toBe(true);
    expect(increases('ADJUSTMENT_POSITIVE')).toBe(true);
    expect(increases('RETURN_CUSTOMER')).toBe(true);
    expect(increases('EXIT')).toBe(false);
    expect(increases('TRANSFER_OUT')).toBe(false);
    expect(increases('ADJUSTMENT_NEGATIVE')).toBe(false);
    expect(increases('SALE')).toBe(false);
    expect(signedQuantity({ type: 'ENTRY', quantity: 20 })).toBe(20);
    expect(signedQuantity({ type: 'EXIT', quantity: 5 })).toBe(-5);
  });

  it('computes the counted quantity of an adjustment, rounded to three decimals', () => {
    expect(adjustedQuantity(12, 3, 'INCREASE')).toBe(15);
    expect(adjustedQuantity(12, 3, 'DECREASE')).toBe(9);
    expect(adjustedQuantity(0.1, 0.2, 'INCREASE')).toBe(0.3);
    expect(adjustedQuantity(2, 5, 'DECREASE')).toBe(-3);
  });

  it('counts only UNIT, BOX and PACK in whole numbers', () => {
    expect(isWholeUnit('UNIT')).toBe(true);
    expect(isWholeUnit('BOX')).toBe(true);
    expect(isWholeUnit('PACK')).toBe(true);
    expect(isWholeUnit('KG')).toBe(false);
  });

  it('summarizes a transfer as source and destination before/after', () => {
    const balances = locationBalances([
      line({
        id: '1',
        type: 'TRANSFER_OUT',
        locationId: 'A',
        previousQuantity: 20,
        newQuantity: 13,
      }),
      line({ id: '2', type: 'TRANSFER_IN', locationId: 'B', previousQuantity: 5, newQuantity: 12 }),
    ]);
    expect(balances).toEqual([
      { locationId: 'A', before: 20, after: 13 },
      { locationId: 'B', before: 5, after: 12 },
    ]);
  });

  it('spans every batch line of a location, whatever their order', () => {
    // FEFO exit of 4 from LOT-A (3) then LOT-B (5): level 8 → 5 → 4.
    const balances = locationBalances([
      line({ id: '2', batchId: 'B', previousQuantity: 5, newQuantity: 4 }),
      line({ id: '1', batchId: 'A', previousQuantity: 8, newQuantity: 5 }),
    ]);
    expect(balances).toEqual([{ locationId: 'A', before: 8, after: 4 }]);
  });
});
