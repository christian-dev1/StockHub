import { Permission } from '../config/permissions/permissions';
import { NAVIGATION } from './navigation';

/** Permissions seeded per role by the backend (catalogue and administration part). */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  VENDEUR: ['PRODUCT_VIEW'],
  ADMIN: [
    'COMPANY_VIEW',
    'USER_VIEW',
    'WAREHOUSE_VIEW',
    'WAREHOUSE_CREATE',
    'WAREHOUSE_UPDATE',
    'CATEGORY_VIEW',
    'CATEGORY_MANAGE',
    'PRODUCT_VIEW',
    'PRODUCT_CREATE',
    'SUPPLIER_VIEW',
    'SUPPLIER_CREATE',
    'SUPPLIER_UPDATE',
    'BARCODE_GENERATE',
    'BARCODE_PRINT',
  ],
  MANAGER: [
    'COMPANY_VIEW',
    'USER_VIEW',
    'WAREHOUSE_VIEW',
    'CATEGORY_VIEW',
    'CATEGORY_MANAGE',
    'PRODUCT_VIEW',
    'PRODUCT_CREATE',
    'SUPPLIER_VIEW',
    'SUPPLIER_CREATE',
    'SUPPLIER_UPDATE',
    'BARCODE_GENERATE',
    'BARCODE_PRINT',
  ],
  MAGASINIER: [
    'WAREHOUSE_VIEW',
    'CATEGORY_VIEW',
    'PRODUCT_VIEW',
    'SUPPLIER_VIEW',
    'BARCODE_GENERATE',
    'BARCODE_PRINT',
  ],
};

function menuFor(role: string): string[] {
  const granted = new Set(ROLE_PERMISSIONS[role]);
  return NAVIGATION.filter((s) => s.audience !== 'platform').flatMap((s) =>
    s.items
      .filter((i) => !i.permissions?.length || i.permissions.some((p) => granted.has(p)))
      .map((i) => i.labelKey),
  );
}

describe('navigation per role', () => {
  it('gives the ADMIN the whole catalogue and administration', () => {
    expect(menuFor('ADMIN')).toEqual([
      'nav.dashboard',
      'nav.products',
      'nav.categories',
      'nav.suppliers',
      'nav.locations',
      'nav.users',
      'nav.companySettings',
    ]);
  });

  it('gives the MANAGER products, categories and suppliers but not locations', () => {
    const menu = menuFor('MANAGER');
    expect(menu).toEqual(
      expect.arrayContaining(['nav.products', 'nav.categories', 'nav.suppliers']),
    );
    expect(menu).not.toContain('nav.locations');
  });

  it('gives the MAGASINIER only the dashboard and products', () => {
    expect(menuFor('MAGASINIER')).toEqual(['nav.dashboard', 'nav.products']);
  });

  it('gives the VENDEUR only the dashboard and products', () => {
    expect(menuFor('VENDEUR')).toEqual(['nav.dashboard', 'nav.products']);
  });
});
