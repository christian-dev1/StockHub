import { describe, expect, it } from 'vitest';
import type { Permission } from '../config/permissions/permissions';
import { activeHref, visibleNavigation } from './navigation';

// Permissions granted by the backend (V2 seed) to each role of the sales app.
const VENDEUR: readonly string[] = [
  'WAREHOUSE_VIEW',
  'CATEGORY_VIEW',
  'PRODUCT_VIEW',
  'STOCK_VIEW',
  'SALE_CREATE',
  'SALE_VIEW',
  'RECEIPT_REPRINT',
];
const MAGASINIER: readonly string[] = ['WAREHOUSE_VIEW', 'CATEGORY_VIEW', 'PRODUCT_VIEW', 'STOCK_VIEW'];

const labels = (granted: readonly string[]) =>
  visibleNavigation((p: Permission) => granted.includes(p)).map((item) => item.labelKey);

describe('navigation', () => {
  it('gives a seller exactly the sales entries and nothing administrative', () => {
    expect(labels(VENDEUR)).toEqual(['home', 'products', 'newSale', 'mySales', 'profile', 'preferences']);
  });

  it('hides sale entries from roles that cannot sell', () => {
    expect(labels(MAGASINIER)).toEqual(['home', 'products', 'profile', 'preferences']);
  });

  it('lights up the most specific entry', () => {
    const items = visibleNavigation(() => true);
    expect(activeHref('/sales/new', items)).toBe('/sales/new');
    expect(activeHref('/sales/abc', items)).toBe('/sales');
    expect(activeHref('/', items)).toBe('/');
    expect(activeHref('/products/1', items)).toBe('/products');
  });
});
