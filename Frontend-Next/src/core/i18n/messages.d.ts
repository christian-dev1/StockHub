import type messages from '../../../messages/fr.json';
import type { routing } from './routing';

/** Type-safe translation keys: a missing key fails the TypeScript build. */
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
