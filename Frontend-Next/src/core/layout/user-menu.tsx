'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { ArrowRightStartOnRectangleIcon, KeyIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { logout } from '../auth/auth-api';
import { useSession } from '../auth/use-session';
import { APP_ROUTES } from '../config/routes/app.routes';
import { useRouter } from '../i18n/navigation';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

/**
 * Account panel: identity, preferences and session actions. A popover (not a
 * menu) because it hosts radio groups; on phones it is the only place where
 * language and theme can be changed, the header being too narrow for them.
 */
export function UserMenu() {
  const t = useTranslations();
  const { session } = useSession();
  const router = useRouter();
  if (!session) return null;
  const initials = `${session.firstName.charAt(0)}${session.lastName.charAt(0)}`.toUpperCase();
  const itemClass =
    'hover:bg-surface-muted focus-visible:bg-surface-muted flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm focus-visible:outline-none';

  return (
    <Popover className="relative">
      <PopoverButton
        aria-label={t('nav.userMenu')}
        className="bg-primary text-primary-fg data-focus:outline-focus flex size-10 items-center justify-center rounded-full text-xs font-semibold data-focus:outline-2 data-focus:outline-offset-2"
      >
        {initials}
      </PopoverButton>
      <PopoverPanel
        anchor="bottom end"
        className="border-border bg-surface shadow-card z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border p-1 [--anchor-gap:6px] focus:outline-none"
      >
        {({ close }) => (
          <>
            <div className="border-border mb-1 border-b px-3 py-2">
              <p className="text-fg truncate text-sm font-medium">
                {session.firstName} {session.lastName}
              </p>
              <p className="text-fg-muted truncate text-xs">{t(`roles.${session.role}`)}</p>
              {session.company && <p className="text-fg-muted truncate text-xs">{session.company.name}</p>}
            </div>
            <section
              aria-labelledby="user-menu-preferences"
              className="border-border mb-1 grid gap-2 border-b px-3 pt-1 pb-3 sm:hidden"
            >
              <h2 id="user-menu-preferences" className="text-fg-muted text-xs font-medium">
                {t('nav.preferences')}
              </h2>
              <div className="flex flex-wrap gap-2">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </section>
            <button
              type="button"
              onClick={() => {
                close();
                router.push(APP_ROUTES.CHANGE_PASSWORD);
              }}
              className={`text-fg ${itemClass}`}
            >
              <KeyIcon className="text-fg-muted size-4" aria-hidden="true" />
              {t('auth.changePassword.title')}
            </button>
            <button
              type="button"
              onClick={() => logout().finally(() => router.replace(APP_ROUTES.LOGIN))}
              className={`text-danger ${itemClass}`}
            >
              <ArrowRightStartOnRectangleIcon className="size-4" aria-hidden="true" />
              {t('auth.logout')}
            </button>
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
