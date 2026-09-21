import { CubeIcon } from '@heroicons/react/24/solid';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/core/layout/language-switcher';
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
      <div className="flex items-center justify-between p-4">
        <span className="flex items-center gap-2">
          <span className="bg-primary text-primary-fg flex size-9 items-center justify-center rounded-lg">
            <CubeIcon className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">StockHub</span>
        </span>
        <div className="flex gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
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
