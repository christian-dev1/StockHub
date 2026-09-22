import { Permission } from '../config/permissions/permissions';
import { APP_ROUTES } from '../config/routes/app.routes';

export type Audience = 'platform' | 'company' | 'all';

export interface NavigationItem {
  readonly labelKey: string;
  readonly icon: string;
  readonly route: string;
  /** Shown when the user holds any of these permissions (UI hint only). */
  readonly permissions?: readonly Permission[];
  /** Highlighted only on its own URL, not on the child pages that have their own entry. */
  readonly exact?: boolean;
}

export interface NavigationSection {
  readonly labelKey: string;
  readonly audience: Audience;
  readonly items: readonly NavigationItem[];
}

/** Sidebar structure; features append their entries here as they are delivered. */
export const NAVIGATION: readonly NavigationSection[] = [
  {
    labelKey: 'nav.section.overview',
    audience: 'all',
    items: [{ labelKey: 'nav.dashboard', icon: 'pi-chart-bar', route: APP_ROUTES.DASHBOARD }],
  },
  {
    labelKey: 'nav.section.platform',
    audience: 'platform',
    items: [
      {
        labelKey: 'nav.companies',
        icon: 'pi-building',
        route: APP_ROUTES.PLATFORM.COMPANIES,
        permissions: ['COMPANY_VIEW'],
      },
    ],
  },
  {
    labelKey: 'nav.section.catalogue',
    audience: 'company',
    items: [
      {
        labelKey: 'nav.products',
        icon: 'pi-box',
        route: APP_ROUTES.PRODUCTS.ROOT,
        permissions: ['PRODUCT_VIEW'],
      },
      // Categories and suppliers are listed for the roles that maintain them;
      // read-only roles see them through the products screens.
      {
        labelKey: 'nav.categories',
        icon: 'pi-sitemap',
        route: APP_ROUTES.CATEGORIES.ROOT,
        permissions: ['CATEGORY_MANAGE'],
      },
      {
        labelKey: 'nav.suppliers',
        icon: 'pi-truck',
        route: APP_ROUTES.SUPPLIERS.ROOT,
        permissions: ['SUPPLIER_CREATE', 'SUPPLIER_UPDATE'],
      },
    ],
  },
  {
    labelKey: 'nav.section.stock',
    audience: 'company',
    items: [
      {
        labelKey: 'nav.stock',
        icon: 'pi-warehouse',
        route: APP_ROUTES.STOCK.ROOT,
        permissions: ['STOCK_VIEW'],
        exact: true,
      },
      {
        labelKey: 'nav.stockMovements',
        icon: 'pi-history',
        route: APP_ROUTES.STOCK.MOVEMENTS,
        permissions: ['STOCK_VIEW'],
      },
      {
        labelKey: 'nav.batches',
        icon: 'pi-calendar-clock',
        route: APP_ROUTES.STOCK.BATCHES,
        permissions: ['BATCH_MANAGE'],
      },
      {
        labelKey: 'nav.stockDocuments',
        icon: 'pi-file',
        route: APP_ROUTES.STOCK.DOCUMENTS,
        permissions: ['STOCK_VIEW'],
      },
    ],
  },
  {
    labelKey: 'nav.section.administration',
    audience: 'company',
    items: [
      {
        labelKey: 'nav.locations',
        icon: 'pi-map-marker',
        route: APP_ROUTES.LOCATIONS.ROOT,
        permissions: ['WAREHOUSE_CREATE', 'WAREHOUSE_UPDATE'],
      },
      {
        labelKey: 'nav.users',
        icon: 'pi-users',
        route: APP_ROUTES.USERS.ROOT,
        permissions: ['USER_VIEW'],
      },
      {
        labelKey: 'nav.companySettings',
        icon: 'pi-cog',
        route: APP_ROUTES.SETTINGS.COMPANY,
        permissions: ['COMPANY_VIEW'],
      },
    ],
  },
];
