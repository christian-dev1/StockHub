import {
  CubeIcon,
  HomeIcon,
  PlusCircleIcon,
  ReceiptPercentIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import type { Permission } from '../config/permissions/permissions';
import { APP_ROUTES } from '../config/routes/app.routes';

export interface NavigationItem {
  /** Key under the "nav" i18n namespace. */
  readonly labelKey: 'home' | 'products' | 'newSale' | 'mySales' | 'profile' | 'preferences';
  readonly href: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** All of them are required; the backend checks them again on every call. */
  readonly permissions?: readonly Permission[];
  /** Shown in the phone tab bar (the others stay in the user menu). */
  readonly mobile: boolean;
}

/**
 * Entries are filtered by permission: a VENDEUR gets exactly these; nothing
 * administrative exists in the sales app.
 */
export const NAVIGATION: readonly NavigationItem[] = [
  { labelKey: 'home', href: APP_ROUTES.HOME, icon: HomeIcon, mobile: true },
  {
    labelKey: 'products',
    href: APP_ROUTES.PRODUCTS,
    icon: CubeIcon,
    permissions: ['PRODUCT_VIEW', 'STOCK_VIEW'],
    mobile: true,
  },
  {
    labelKey: 'newSale',
    href: APP_ROUTES.NEW_SALE,
    icon: PlusCircleIcon,
    permissions: ['SALE_CREATE', 'PRODUCT_VIEW', 'STOCK_VIEW'],
    mobile: true,
  },
  {
    labelKey: 'mySales',
    href: APP_ROUTES.SALES,
    icon: ReceiptPercentIcon,
    permissions: ['SALE_VIEW'],
    mobile: true,
  },
  { labelKey: 'profile', href: APP_ROUTES.PROFILE, icon: UserCircleIcon, mobile: false },
  { labelKey: 'preferences', href: APP_ROUTES.PREFERENCES, icon: AdjustmentsHorizontalIcon, mobile: false },
];

export function visibleNavigation(can: (permission: Permission) => boolean): readonly NavigationItem[] {
  return NAVIGATION.filter((item) => (item.permissions ?? []).every(can));
}

/** "/sales" must not light up on "/sales/new": the most specific entry wins. */
export function activeHref(pathname: string, items: readonly NavigationItem[]): string | undefined {
  return items
    .map((item) => item.href)
    .filter((href) =>
      href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`),
    )
    .sort((a, b) => b.length - a.length)[0];
}
