import { CubeIcon } from '@heroicons/react/24/solid';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/core/layout/language-switcher';
import { PreferencesMenu } from '@/core/layout/preferences-menu';
import { ThemeSwitcher } from '@/core/layout/theme-switcher';

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="bg-bg flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 p-4">
        <span className="flex min-w-0 items-center gap-2">
          <span className="bg-primary text-primary-fg flex size-9 shrink-0 items-center justify-center rounded-lg">
            <CubeIcon className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">StockHub</span>
        </span>
        {/* Phones: both switchers do not fit next to the logo, they share one menu. */}
        <div className="sm:hidden">
          <PreferencesMenu />
        </div>
        <div className="hidden gap-2 sm:flex">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm">
          <h1 className="text-fg text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-fg-muted mt-1 text-sm">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
