'use client';

import { useEffect, type ReactNode } from 'react';
import type { Permission } from '../config/permissions/permissions';
import { APP_ROUTES } from '../config/routes/app.routes';
import { useRouter } from '../i18n/navigation';
import { useSession } from './use-session';

/**
 * Page-level guard: a user typing the URL of a page he may not use lands on
 * the 403 page. It only shapes the UI; the API refuses the calls anyway.
 */
export function RequirePermissions({
  permissions,
  children,
}: {
  readonly permissions: readonly Permission[];
  readonly children: ReactNode;
}) {
  const { session, can } = useSession();
  const router = useRouter();
  const allowed = session !== null && permissions.every(can);

  useEffect(() => {
    if (session && !allowed) router.replace(APP_ROUTES.FORBIDDEN);
  }, [session, allowed, router]);

  return allowed ? <>{children}</> : null;
}
