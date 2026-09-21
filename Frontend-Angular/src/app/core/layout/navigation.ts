import { Permission } from '../config/permissions/permissions';
import { APP_ROUTES } from '../config/routes/app.routes';

export interface NavigationItem {
  readonly labelKey: string;
  readonly icon: string;
  readonly route: string;
  /** Item is shown only if the user holds this permission (UI hint only). */
  readonly permission?: Permission;
}

export interface NavigationSection {
  readonly labelKey: string;
  readonly items: readonly NavigationItem[];
}

/** Sidebar structure; features append their entries here as they are delivered. */
export const NAVIGATION: readonly NavigationSection[] = [
  {
    labelKey: 'nav.section.overview',
    items: [{ labelKey: 'nav.dashboard', icon: 'pi-chart-bar', route: APP_ROUTES.DASHBOARD }],
  },
];
