'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ArrowRightStartOnRectangleIcon, KeyIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { logout } from '../auth/auth-api';
import { useSession } from '../auth/use-session';
import { APP_ROUTES } from '../config/routes/app.routes';
import { useRouter } from '../i18n/navigation';

export function UserMenu() {
  const t = useTranslations();
  const { session } = useSession();
  const router = useRouter();
  if (!session) return null;
  const initials = `${session.firstName.charAt(0)}${session.lastName.charAt(0)}`.toUpperCase();

  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label={t('nav.userMenu')}
        className="bg-primary text-primary-fg data-focus:outline-focus flex size-9 items-center justify-center rounded-full text-xs font-semibold data-focus:outline-2 data-focus:outline-offset-2"
      >
        {initials}
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="border-border bg-surface shadow-card z-50 mt-2 w-60 rounded-xl border p-1 [--anchor-gap:4px] focus:outline-none"
      >
        <div className="border-border mb-1 border-b px-3 py-2">
          <p className="text-fg truncate text-sm font-medium">
            {session.firstName} {session.lastName}
          </p>
          <p className="text-fg-muted truncate text-xs">{t(`roles.${session.role}`)}</p>
          {session.company && <p className="text-fg-muted truncate text-xs">{session.company.name}</p>}
        </div>
        <MenuItem>
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.CHANGE_PASSWORD)}
            className="text-fg data-focus:bg-surface-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
          >
            <KeyIcon className="text-fg-muted size-4" aria-hidden="true" />
            {t('auth.changePassword.title')}
          </button>
        </MenuItem>
        <MenuItem>
          <button
            type="button"
            onClick={() => logout().finally(() => router.replace(APP_ROUTES.LOGIN))}
            className="text-danger data-focus:bg-surface-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
          >
            <ArrowRightStartOnRectangleIcon className="size-4" aria-hidden="true" />
            {t('auth.logout')}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
