import { describe, expect, it } from 'vitest';
import { toSale, toSaleSettings } from './sale.mapper';

describe('sale mapper', () => {
  it('parses decimals and dates, and turns an omitted customer name into null', () => {
    const sale = toSale({
      id: 's1',
      number: 'VT-2026-000001',
      status: 'COMPLETED',
      locationId: 'l1',
      locationName: 'Magasin',
      sellerName: 'Vanessa Vendeur',
      paymentMethod: 'MOBILE_MONEY',
      currency: 'XAF',
      totalAmount: '1500.0000',
      createdAt: '2026-09-23T10:00:00Z',
      lines: [
        {
          position: 1,
          productId: 'p1',
          productName: 'Eau',
          sku: 'EAU',
          unit: 'UNIT',
          quantity: '3.000',
          unitPrice: 500,
          lineTotal: '1500.0000',
        },
      ],
    });
    expect(sale.customerName).toBeNull();
    expect(sale.totalAmount).toBe(1500);
    expect(sale.lines[0]?.quantity).toBe(3);
    expect(sale.createdAt.toISOString()).toBe('2026-09-23T10:00:00.000Z');
    expect(sale.paymentMethod).toBe('MOBILE_MONEY');
  });

  it('keeps only known payment methods', () => {
    expect(
      toSaleSettings({ currency: 'XAF', allowNegativeStock: false, paymentMethods: ['CASH', 'GOLD'] })
        .paymentMethods,
    ).toEqual(['CASH']);
  });
});
