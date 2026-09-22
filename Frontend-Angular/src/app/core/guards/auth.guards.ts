import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import { Permission } from '../config/permissions/permissions';
import { APP_ROUTES } from '../config/routes/app.routes';

/** Requires a session; otherwise redirects to login with the requested URL. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth.restore().pipe(
    map((status) => {
      if (status !== 'authenticated') {
        return router.createUrlTree([APP_ROUTES.LOGIN], { queryParams: { returnUrl: state.url } });
      }
      if (auth.mustChangePassword()) {
        return router.createUrlTree([APP_ROUTES.CHANGE_PASSWORD]);
      }
      return true;
    }),
  );
};

/** Login page is only for anonymous visitors. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth
    .restore()
    .pipe(
      map((status) =>
        status === 'authenticated' ? router.createUrlTree([APP_ROUTES.ROOT]) : true,
      ),
    );
};

/** Password change page: any authenticated user (typically with a temporary password). */
export const passwordChangeGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth
    .restore()
    .pipe(
      map((status) =>
        status === 'authenticated' ? true : router.createUrlTree([APP_ROUTES.LOGIN]),
      ),
    );
};

/**
 * UI-level permission check from route data `permissions` (any of). The backend
 * enforces the same rule; this only avoids showing unusable screens.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const required = (route.data['permissions'] as Permission[] | undefined) ?? [];
  return auth.canAny(required) ? true : router.createUrlTree([APP_ROUTES.FORBIDDEN]);
};

/** Platform area: super admin only. */
export const platformGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth.isSuperAdmin() ? true : router.createUrlTree([APP_ROUTES.FORBIDDEN]);
};

/** Company area: users attached to a company (never the platform super admin). */
export const companyGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth.company() ? true : router.createUrlTree([APP_ROUTES.PLATFORM.COMPANIES]);
};

/**
 * The back-office is closed to sales-only roles (VENDEUR), who are sent to a
 * page pointing them to the sales app. Anonymous users are left to authGuard,
 * whose login redirect takes precedence.
 */
export const backOfficeGuard: CanActivateFn & CanActivateChildFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth
    .restore()
    .pipe(
      map((status) =>
        status !== 'authenticated' || auth.canUseBackOffice()
          ? true
          : router.createUrlTree([APP_ROUTES.SALES_APP_ONLY]),
      ),
    );
};

/** The "sales app only" page only makes sense for users who cannot use the back-office. */
export const salesAppOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth.canUseBackOffice() ? router.createUrlTree([APP_ROUTES.DASHBOARD]) : true;
};
