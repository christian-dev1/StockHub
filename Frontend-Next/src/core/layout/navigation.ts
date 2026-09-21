import { HomeIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import type { Permission } from '../config/permissions/permissions';
import { APP_ROUTES } from '../config/routes/app.routes';

export interface NavigationItem {
  /** Key under the "nav" i18n namespace. */
  readonly labelKey: 'home';
  readonly href: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly permission?: Permission;
}

/** Features append their entries as they are delivered (POS, scan, sales…). */
export const NAVIGATION: readonly NavigationItem[] = [
  { labelKey: 'home', href: APP_ROUTES.HOME, icon: HomeIcon },
];
