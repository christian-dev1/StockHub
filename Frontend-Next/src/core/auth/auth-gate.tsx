'use client';

import { useTranslations } from 'next-intl';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { SALES_APP_ROLES } from '../config/permissions/permissions';
import { APP_ROUTES } from '../config/routes/app.routes';
import { usePathname, useRouter } from '../i18n/navigation';
import { refreshSession } from './auth-api';
import { useSession } from './use-session';

/**
 * Client-side route protection for the authenticated area. It only shapes the
 * UI: every API call is authorized again by the backend.
 */
export function AuthGate({ children }: { readonly children: ReactNode }) {
  const { status, session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  useEffect(() => {
    if (status === 'unknown') {
      refreshSession().catch(() => undefined);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`${APP_ROUTES.LOGIN}?returnUrl=${encodeURIComponent(pathname)}`);
    } else if (session?.mustChangePassword) {
      router.replace(APP_ROUTES.CHANGE_PASSWORD);
    } else if (session && !SALES_APP_ROLES.includes(session.role)) {
      router.replace(APP_ROUTES.FORBIDDEN);
    }
  }, [status, session, router, pathname]);

  if (
    status !== 'authenticated' ||
    session?.mustChangePassword ||
    (session && !SALES_APP_ROLES.includes(session.role))
  ) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <span className="sr-only">{t('loading')}</span>
        <div className="w-64 space-y-3" aria-hidden="true">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
