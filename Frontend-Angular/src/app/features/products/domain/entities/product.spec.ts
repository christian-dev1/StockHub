import { consistentTracking, isDiscrete, marginRate, sellsAtLoss } from './product';
import { ImportPreview, canCommit } from './product-import';

describe('product rules', () => {
  it('expiry tracking implies batch tracking', () => {
    expect(consistentTracking({ batchTracked: false, expiryTracked: true })).toEqual({
      batchTracked: true,
      expiryTracked: true,
    });
    expect(consistentTracking({ batchTracked: true, expiryTracked: false })).toEqual({
      batchTracked: true,
      expiryTracked: false,
    });
  });

  it('knows discrete units, losses and margins', () => {
    expect(isDiscrete('BOX')).toBe(true);
    expect(isDiscrete('KG')).toBe(false);
    expect(sellsAtLoss({ purchasePrice: 10, salePrice: 8 })).toBe(true);
    expect(marginRate({ purchasePrice: 300, salePrice: 500 })).toBeCloseTo(0.4);
    expect(marginRate({ purchasePrice: 300, salePrice: 0 })).toBeNull();
  });
});

describe('canCommit', () => {
  const preview: ImportPreview = {
    jobId: 'j',
    fileName: 'f.csv',
    totalRows: 2,
    createCount: 2,
    updateCount: 0,
    errorCount: 0,
    categoriesToCreate: [],
    rows: [],
    expiresAt: new Date('2026-09-22T11:00:00Z'),
  };
  const now = new Date('2026-09-22T10:00:00Z');

  it('allows a clean, unexpired preview only', () => {
    expect(canCommit(preview, now)).toBe(true);
    expect(canCommit({ ...preview, errorCount: 1 }, now)).toBe(false);
    expect(canCommit({ ...preview, createCount: 0 }, now)).toBe(false);
    expect(canCommit(preview, new Date('2026-09-22T12:00:00Z'))).toBe(false);
  });
});
