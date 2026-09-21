import { Permission } from '../config/permissions/permissions';
import { APP_ROUTES } from '../config/routes/app.routes';

export type Audience = 'platform' | 'company' | 'all';

export interface NavigationItem {
  readonly labelKey: string;
  readonly icon: string;
  readonly route: string;
  /** Shown when the user holds any of these permissions (UI hint only). */
  readonly permissions?: readonly Permission[];
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
    labelKey: 'nav.section.administration',
    audience: 'company',
    items: [
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
