'use client';

import { Radio, RadioGroup } from '@headlessui/react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '../i18n/navigation';
import { routing, type Locale } from '../i18n/routing';

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const change = (next: Locale) =>
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });

  return (
    <RadioGroup
      value={locale}
      onChange={change}
      disabled={isPending}
      aria-label={t('label')}
      className="border-border bg-surface-muted inline-flex rounded-lg border p-0.5"
    >
      {routing.locales.map((value) => (
        <Radio
          key={value}
          value={value}
          aria-label={t(value)}
          lang={value}
          className="text-fg-muted hover:text-fg data-checked:bg-surface data-checked:text-primary data-checked:shadow-card data-focus:outline-focus flex h-9 min-w-10 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-semibold uppercase transition-colors data-focus:outline-2"
        >
          {value}
        </Radio>
      ))}
    </RadioGroup>
  );
}
