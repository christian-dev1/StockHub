import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../../../../core/auth/auth-store';
import { Permission } from '../../../../core/config/permissions/permissions';
import { SessionLocation } from '../../../../core/auth/session.model';
import { StockContext } from './stock-context';

const location = (id: string, primary = false): SessionLocation => ({
  id,
  code: id.toUpperCase(),
  name: `Site ${id}`,
  type: 'STORE',
  primary,
});

const MAGASINIER: Permission[] = [
  'STOCK_VIEW',
  'STOCK_ENTRY',
  'STOCK_EXIT',
  'STOCK_TRANSFER',
  'BATCH_MANAGE',
];

function context(permissions: Permission[], locations: SessionLocation[]): StockContext {
  const granted = new Set(permissions);
  TestBed.configureTestingModule({
    providers: [
      StockContext,
      {
        provide: AuthStore,
        useValue: {
          locations: signal(locations),
          company: signal({ allowNegativeStock: false, expiryWarningDays: 30 }),
          can: (permission: Permission) => granted.has(permission),
        },
      },
    ],
  });
  return TestBed.inject(StockContext);
}

describe('StockContext', () => {
  it('offers every operation to an ADMIN with several locations', () => {
    const stock = context([...MAGASINIER, 'STOCK_ADJUST'], [location('b'), location('a', true)]);
    expect(stock.operations()).toEqual(['entry', 'exit', 'transfer', 'adjustment']);
    expect(stock.multiLocation()).toBe(true);
    // The primary location comes first and is preselected.
    expect(stock.defaultLocationId()).toBe('a');
  });

  it('hides the adjustment from a MAGASINIER without STOCK_ADJUST', () => {
    const stock = context(MAGASINIER, [location('a', true), location('b')]);
    expect(stock.operations()).toEqual(['entry', 'exit', 'transfer']);
    expect(stock.can('adjustment')).toBe(false);
  });

  it('hides transfers when the user has a single location', () => {
    const stock = context([...MAGASINIER, 'STOCK_ADJUST'], [location('a', true)]);
    expect(stock.multiLocation()).toBe(false);
    expect(stock.operations()).toEqual(['entry', 'exit', 'adjustment']);
    expect(stock.defaultLocationId()).toBe('a');
  });

  it('offers no operation to a read-only role', () => {
    const stock = context(['STOCK_VIEW'], [location('a', true)]);
    expect(stock.operations()).toEqual([]);
  });
});
