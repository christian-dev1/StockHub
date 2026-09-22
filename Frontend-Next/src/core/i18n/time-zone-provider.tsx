'use client';

import { NextIntlClientProvider, useLocale } from 'next-intl';
import { useSyncExternalStore, type ReactNode } from 'react';
import { useSession } from '../auth/use-session';
import { FALLBACK_TIME_ZONE, browserTimeZone, resolveTimeZone } from './time-zone';

const noop = () => () => undefined;

/**
 * Applies the display time zone to every next-intl formatter below it.
 * Pre-rendered HTML uses UTC; the client switches to the company zone (or the
 * browser zone before sign-in) as soon as it is known.
 */
export function TimeZoneProvider({ children }: { readonly children: ReactNode }) {
  const locale = useLocale();
  const { session } = useSession();
  const browserZone = useSyncExternalStore(noop, browserTimeZone, () => FALLBACK_TIME_ZONE);
  const timeZone = resolveTimeZone(session?.company?.timezone, browserZone);
  return (
    <NextIntlClientProvider locale={locale} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
