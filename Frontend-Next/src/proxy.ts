import createMiddleware from 'next-intl/middleware';
import { routing } from './core/i18n/routing';

/** Locale negotiation and prefixing (Next.js 16 "proxy", formerly middleware). */
export default createMiddleware(routing);

export const config = {
  // Skip the API rewrites, Next internals and static files.
  matcher: ['/((?!api|actuator|_next|_vercel|.*\\..*).*)'],
};
