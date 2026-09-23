'use client';

import { CubeIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { useSession } from '../auth/use-session';
import { Link, usePathname } from '../i18n/navigation';
import { LanguageSwitcher } from './language-switcher';
import { activeHref, visibleNavigation } from './navigation';
import { ThemeSwitcher } from './theme-switcher';
import { UserMenu } from './user-menu';

/**
 * Mobile-first frame: top bar + bottom tab bar on phones/tablets (thumb reach
 * for the POS), persistent sidebar from the lg breakpoint.
 */
export function AppShell({ children }: { readonly children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { can } = useSession();
  const items = visibleNavigation(can);
  const current = activeHref(pathname, items);
  const isActive = (href: string) => href === current;

  return (
    <>
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-fg sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
      >
        {t('a11y.skipToContent')}
      </a>
      <div className="flex min-h-dvh">
        <aside
          aria-label={t('nav.sidebar')}
          className="border-border bg-surface hidden w-64 shrink-0 flex-col border-r lg:flex"
        >
          <Brand />
          <nav aria-label={t('nav.main')} className="flex-1 p-3">
            <ul className="flex flex-col gap-0.5">
              {items.map(({ href, icon: Icon, labelKey }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(href) ? 'page' : undefined}
                    className={cn(
                      'text-fg hover:bg-surface-muted flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                      isActive(href) && 'bg-surface-muted text-primary',
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {t(`nav.${labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-border bg-surface/90 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur sm:h-16 sm:px-6">
            <div className="lg:hidden">
              <Brand compact />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 sm:flex">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
              <UserMenu />
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-screen-xl flex-1 px-4 pt-6 pb-24 focus:outline-none sm:px-6 lg:px-8 lg:pb-8"
          >
            {children}
          </main>
        </div>
      </div>

      <nav
        aria-label={t('nav.main')}
        className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-md justify-around">
          {items
            .filter((item) => item.mobile)
            .map(({ href, icon: Icon, labelKey }) => (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={cn(
                    'text-fg-muted flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium',
                    isActive(href) && 'text-primary',
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                  {t(`nav.${labelKey}`)}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </>
  );
}

function Brand({ compact = false }: { readonly compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', !compact && 'border-border h-16 border-b px-5')}>
      <span className="bg-primary text-primary-fg flex size-8 items-center justify-center rounded-lg">
        <CubeIcon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight">StockHub</span>
    </div>
  );
}
