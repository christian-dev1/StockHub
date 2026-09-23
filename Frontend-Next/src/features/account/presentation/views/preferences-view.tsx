'use client';

import { LockClosedIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/core/layout/language-switcher';
import { ThemeSwitcher } from '@/core/layout/theme-switcher';
import { useSaleLocation } from '@/core/preferences/sale-location';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { PageHeader } from '@/shared/ui/page-header';
import { SelectField } from '@/shared/ui/select-field';

/**
 * Personal settings of this device. The currency is the company's: shown,
 * never editable here.
 */
export function PreferencesView() {
  const t = useTranslations('preferences');
  const { location, locations, choose } = useSaleLocation();
  const { currency, money } = useFormatters();

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="sh-card divide-border divide-y">
        <Row title={t('language')} hint={t('languageHint')}>
          <LanguageSwitcher />
        </Row>
        <Row title={t('theme')} hint={t('themeHint')}>
          <ThemeSwitcher />
        </Row>
        {locations.length > 1 && location && (
          <div className="p-5">
            <SelectField
              label={t('location')}
              hint={t('locationHint')}
              value={location.id}
              onChange={(event) => choose(event.target.value)}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </SelectField>
          </div>
        )}
        {locations.length === 1 && location && (
          <Row title={t('location')} hint={t('locationHint')}>
            <span className="text-fg text-sm font-medium">{location.name}</span>
          </Row>
        )}
        <Row title={t('currency')} hint={t('currencyHint')}>
          <span className="text-fg inline-flex items-center gap-1.5 text-sm font-semibold">
            <LockClosedIcon className="text-fg-muted size-4" aria-hidden="true" />
            {currency}
          </span>
        </Row>
        <Row title={t('numbers')} hint={t('numbersHint', { example: money(1234567.5) })}>
          {null}
        </Row>
      </div>
    </div>
  );
}

function Row({
  title,
  hint,
  children,
}: {
  readonly title: string;
  readonly hint: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-fg text-sm font-semibold">{title}</h2>
        <p className="text-fg-muted mt-0.5 text-sm">{hint}</p>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </section>
  );
}
