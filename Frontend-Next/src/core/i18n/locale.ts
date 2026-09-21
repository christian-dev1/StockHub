import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from './routing';

/** Validates the [locale] route segment, enables static rendering and returns it typed. */
export function enableLocale(segment: string): Locale {
  if (!hasLocale(routing.locales, segment)) {
    notFound();
  }
  setRequestLocale(segment);
  return segment;
}
