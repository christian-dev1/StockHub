import {
  toAdjustmentRequest,
  toBatch,
  toEntryRequest,
  toExitRequest,
  toStockDocument,
  toStockLevel,
  toStockUser,
  toTransferRequest,
} from './stock.mapper';

describe('stock mappers', () => {
  it('maps a level, turning decimals and dates into numbers and Date', () => {
    const level = toStockLevel({
      id: 'l1',
      productId: 'p1',
      locationId: 'a',
      sku: 'PRD-000001',
      productName: 'Riz',
      quantity: 12.5,
      minStock: null,
      lowStock: false,
      updatedAt: '2026-09-22T10:00:00Z',
    });
    expect(level.quantity).toBe(12.5);
    expect(level.minStock).toBe(0);
    expect(level.updatedAt.toISOString()).toBe('2026-09-22T10:00:00.000Z');
  });

  it('maps a document with its lines, and a summary without', () => {
    const header = {
      id: 'd1',
      type: 'EXIT' as const,
      number: 'BS-2026-000001',
      locationId: 'a',
      destinationLocationId: null,
      reference: null,
      reason: 'Vente',
      performedBy: 'u1',
      performedByName: 'Aline Admin',
      createdAt: '2026-09-22T10:00:00Z',
    };
    expect(toStockDocument(header).lines).toEqual([]);
    const document = toStockDocument({
      ...header,
      lines: [
        {
          id: 'm1',
          productId: 'p1',
          locationId: 'a',
          batchId: 'b1',
          documentId: 'd1',
          type: 'EXIT',
          quantity: 3,
          previousQuantity: 8,
          newQuantity: 5,
          reference: 'BS-2026-000001',
          reason: 'Vente',
          performedBy: 'u1',
          createdAt: '2026-09-22T10:00:00Z',
        },
      ],
    });
    expect(document.lines[0]).toMatchObject({ batchId: 'b1', quantity: 3, newQuantity: 5 });
  });

  it('keeps calendar dates of batches as sent', () => {
    const batch = toBatch({
      id: 'b1',
      productId: 'p1',
      locationId: 'a',
      batchNumber: 'LOT-A',
      quantity: 3,
      manufacturingDate: null,
      expirationDate: '2026-10-01',
      status: 'ACTIVE',
      expiryStatus: 'EXPIRING_SOON',
    });
    expect(batch.expirationDate).toBe('2026-10-01');
  });

  it('builds an entry request, with batch fields only for tracked products', () => {
    const base = {
      locationId: 'a',
      productId: 'p1',
      quantity: 20,
      reason: '  ',
      reference: ' BL-42 ',
    };
    expect(toEntryRequest({ ...base, batch: null })).toEqual({
      locationId: 'a',
      reason: null,
      reference: 'BL-42',
      lines: [{ productId: 'p1', quantity: 20 }],
    });
    const tracked = toEntryRequest({
      ...base,
      batch: { batchNumber: 'LOT-A', manufacturingDate: null, expirationDate: '2026-12-31' },
    });
    expect((tracked['lines'] as object[])[0]).toEqual({
      productId: 'p1',
      quantity: 20,
      batchNumber: 'LOT-A',
      manufacturingDate: null,
      expirationDate: '2026-12-31',
    });
  });

  it('never sends a batch on exits and transfers (FEFO is the backend job)', () => {
    const exit = toExitRequest({
      locationId: 'a',
      productId: 'p1',
      quantity: 4,
      reason: '',
      reference: '',
    });
    expect(exit['lines']).toEqual([{ productId: 'p1', quantity: 4 }]);
    const transfer = toTransferRequest({
      sourceLocationId: 'a',
      destinationLocationId: 'b',
      productId: 'p1',
      quantity: 7,
      reason: 'Réassort',
      reference: '',
    });
    expect(transfer).toEqual({
      sourceLocationId: 'a',
      destinationLocationId: 'b',
      reason: 'Réassort',
      reference: null,
      lines: [{ productId: 'p1', quantity: 7 }],
    });
  });

  it('sends the counted quantity of an adjustment', () => {
    expect(
      toAdjustmentRequest({
        locationId: 'a',
        productId: 'p1',
        batchId: null,
        countedQuantity: 9,
        reason: ' Casse ',
      }),
    ).toEqual({
      locationId: 'a',
      productId: 'p1',
      batchId: null,
      countedQuantity: 9,
      reason: 'Casse',
    });
  });

  it('names users by first and last name', () => {
    expect(toStockUser({ id: 'u', firstName: 'Moussa', lastName: 'Magasinier' }).name).toBe(
      'Moussa Magasinier',
    );
  });
});
