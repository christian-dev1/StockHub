import { APP_ROUTES } from '../../../core/config/routes/app.routes';

/**
 * Where a successful sign-in leads. Kept as a pure function so the login page
 * and the forced password change share the same rule and it stays unit tested:
 * every authenticated role stays in Angular.
 */
export interface LoginNavigation {
  /** Absolute URL to open when the user must leave the back-office (sellers). */
  readonly externalUrl: string | null;
  /** In-app route otherwise. */
  readonly route: string | null;
}

export function loginNavigation(
  session: { readonly mustChangePassword: boolean },
  returnUrl: string | null | undefined,
): LoginNavigation {
  // A temporary password must be replaced here first: the sales app cannot.
  if (session.mustChangePassword) {
    return { externalUrl: null, route: APP_ROUTES.CHANGE_PASSWORD };
  }
  return { externalUrl: null, route: safeReturnUrl(returnUrl) };
}

/** Only same-app relative paths are accepted (no open redirect). */
export function safeReturnUrl(url: string | null | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : APP_ROUTES.ROOT;
}
