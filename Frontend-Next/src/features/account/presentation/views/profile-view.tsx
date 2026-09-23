'use client';

import { ArrowRightStartOnRectangleIcon, KeyIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { logout } from '@/core/auth/auth-api';
import { useSession } from '@/core/auth/use-session';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { Link, useRouter } from '@/core/i18n/navigation';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';

/**
 * Read-only identity. Name, role, company and locations are managed by the
 * company administrator; the user only changes his password or signs out.
 */
export function ProfileView() {
  const t = useTranslations();
  const { session } = useSession();
  const router = useRouter();
  if (!session) return null;

  const rows: [string, string][] = [
    [t('profile.name'), `${session.firstName} ${session.lastName}`],
    [t('profile.email'), session.email],
    [t('profile.role'), t(`roles.${session.role}`)],
    ...(session.company ? ([[t('profile.company'), session.company.name]] as [string, string][]) : []),
    [
      t('profile.locations'),
      session.allLocations
        ? t('profile.allLocations')
        : session.locations.map((l) => l.name).join(', ') || '—',
    ],
  ];

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <section className="sh-card p-5" aria-label={t('profile.title')}>
        <dl className="divide-border divide-y">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[12rem_1fr]">
              <dt className="text-fg-muted text-sm">{label}</dt>
              <dd className="text-fg font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <Alert tone="info">{t('profile.managed')}</Alert>
        </div>
      </section>

      <section className="sh-card mt-4 p-5" aria-labelledby="security-title">
        <h2 id="security-title" className="text-fg mb-3 text-base font-semibold">
          {t('profile.security')}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={APP_ROUTES.CHANGE_PASSWORD}
            className="border-border bg-surface text-fg hover:bg-surface-muted inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"
          >
            <KeyIcon className="size-4" aria-hidden="true" />
            {t('auth.changePassword.title')}
          </Link>
          <Button
            variant="secondary"
            className="text-danger"
            onClick={() => logout().finally(() => router.replace(APP_ROUTES.LOGIN))}
          >
            <ArrowRightStartOnRectangleIcon className="size-4" aria-hidden="true" />
            {t('auth.logout')}
          </Button>
        </div>
      </section>
    </div>
  );
}
