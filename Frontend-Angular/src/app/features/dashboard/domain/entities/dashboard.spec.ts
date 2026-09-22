import { dashboardVariant, statusShares } from './dashboard';

const canValueView = (permission: string) => permission === 'STOCK_VALUE_VIEW';

describe('dashboardVariant', () => {
  it('gives the super admin the platform dashboard whatever the permissions', () => {
    expect(dashboardVariant('SUPER_ADMIN', () => false)).toBe('platform');
    expect(dashboardVariant('SUPER_ADMIN', canValueView)).toBe('platform');
  });

  it('gives ADMIN and MANAGER the business dashboard (both hold STOCK_VALUE_VIEW)', () => {
    expect(dashboardVariant('ADMIN', canValueView)).toBe('business');
    expect(dashboardVariant('MANAGER', canValueView)).toBe('business');
  });

  it('gives the storekeeper the operational dashboard, never the financial one', () => {
    expect(dashboardVariant('MAGASINIER', () => false)).toBe('operations');
    // Even with a stray value-view grant, a vendor never reaches the back office;
    // without STOCK_VALUE_VIEW the layout stays operational.
    expect(dashboardVariant('VENDEUR', () => false)).toBe('operations');
  });

  it('falls back to the operational layout without a role', () => {
    expect(dashboardVariant(undefined, () => false)).toBe('operations');
  });

  it('follows the permission rather than the role name', () => {
    expect(dashboardVariant('ADMIN', () => false)).toBe('operations');
    expect(dashboardVariant('MAGASINIER', canValueView)).toBe('business');
  });
});

describe('statusShares', () => {
  it('returns zeroes on an empty stock rather than NaN', () => {
    expect(statusShares({ normal: 0, low: 0, out: 0, negative: 0 })).toEqual({
      normal: 0,
      low: 0,
      out: 0,
      total: 0,
    });
  });

  it('splits the three states over one hundred percent', () => {
    expect(statusShares({ normal: 1, low: 1, out: 2, negative: 0 })).toEqual({
      normal: 25,
      low: 25,
      out: 50,
      total: 4,
    });
  });

  it('rounds to one decimal', () => {
    const shares = statusShares({ normal: 2, low: 1, out: 0, negative: 0 });
    expect(shares.normal).toBe(66.7);
    expect(shares.low).toBe(33.3);
    expect(shares.out).toBe(0);
  });

  it('ignores the negative levels, which belong to the out state', () => {
    const shares = statusShares({ normal: 3, low: 0, out: 1, negative: 1 });
    expect(shares.total).toBe(4);
    expect(shares.normal).toBe(75);
    expect(shares.out).toBe(25);
  });
});
