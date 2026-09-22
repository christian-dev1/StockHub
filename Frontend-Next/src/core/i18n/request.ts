import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { FALLBACK_TIME_ZONE } from './time-zone';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    // Server output is pre-rendered once; TimeZoneProvider applies the real zone on the client.
    timeZone: FALLBACK_TIME_ZONE,
    messages: (await import(`../../../messages/${locale}.json`)).default,
  };
});
