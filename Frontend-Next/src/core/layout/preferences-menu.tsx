'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/20/solid';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

/**
 * Language and theme behind one button, for headers too narrow to show both
 * switchers inline (phones). The button shows the current language so that a
 * visitor who does not read it can still find the way to change it.
 */
export function PreferencesMenu() {
  const t = useTranslations('nav');
  const locale = useLocale();

  return (
    <Popover className="relative">
      <PopoverButton
        aria-label={t('preferences')}
        className="border-border bg-surface-muted text-fg data-focus:outline-focus flex h-10 min-w-11 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold uppercase data-focus:outline-2"
      >
        <AdjustmentsHorizontalIcon className="text-fg-muted size-4" aria-hidden="true" />
        <span aria-hidden="true">{locale}</span>
      </PopoverButton>
      <PopoverPanel
        anchor="bottom end"
        className="border-border bg-surface shadow-card z-50 grid w-max max-w-[calc(100vw-2rem)] gap-3 rounded-xl border p-3 [--anchor-gap:6px] focus:outline-none"
      >
        <h2 className="text-fg-muted text-xs font-medium">{t('preferences')}</h2>
        <div className="flex flex-wrap gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </PopoverPanel>
    </Popover>
  );
}
