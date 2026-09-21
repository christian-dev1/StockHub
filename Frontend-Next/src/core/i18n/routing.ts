import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

/** BCP 47 locale for Intl formatters. */
export const INTL_LOCALES: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US' };
