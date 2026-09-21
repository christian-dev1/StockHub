'use client';

import { Radio, RadioGroup } from '@headlessui/react';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useMounted } from '@/shared/hooks/use-mounted';
import type { ThemePreference } from '../config/theme/theme';

const OPTIONS = [
  { value: 'light', icon: SunIcon },
  { value: 'dark', icon: MoonIcon },
  { value: 'system', icon: ComputerDesktopIcon },
] as const satisfies ReadonlyArray<{ value: ThemePreference; icon: unknown }>;

export function ThemeSwitcher() {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  // The stored theme is unknown during SSR: reserve the space to avoid layout shift.
  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="border-border bg-surface-muted h-[38px] w-[116px] rounded-lg border"
      />
    );
  }

  return (
    <RadioGroup
      value={(theme as ThemePreference | undefined) ?? 'system'}
      onChange={(value: ThemePreference) => setTheme(value)}
      aria-label={t('label')}
      className="border-border bg-surface-muted inline-flex rounded-lg border p-0.5"
    >
      {OPTIONS.map(({ value, icon: Icon }) => (
        <Radio
          key={value}
          value={value}
          aria-label={t(value)}
          title={t(value)}
          className="text-fg-muted hover:text-fg data-checked:bg-surface data-checked:text-primary data-checked:shadow-card data-focus:outline-focus flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors data-focus:outline-2"
        >
          <Icon className="size-4" aria-hidden="true" />
        </Radio>
      ))}
    </RadioGroup>
  );
}
