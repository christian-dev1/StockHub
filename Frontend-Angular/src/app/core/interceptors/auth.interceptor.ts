import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import { API_ROUTES, PUBLIC_AUTH_ENDPOINTS } from '../config/routes/api.routes';
import { APP_ROUTES } from '../config/routes/app.routes';

function isApiCall(request: HttpRequest<unknown>): boolean {
  return request.url.startsWith(API_ROUTES.BASE) && !PUBLIC_AUTH_ENDPOINTS.includes(request.url);
}

function withToken(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
}

/**
 * Adds the bearer token to API calls. On a 401 it refreshes the session once
 * (shared between concurrent requests) and replays the request; if the refresh
 * fails the user is sent to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiCall(request)) {
    return next(request);
  }
  const auth = inject(AuthStore);
  const router = inject(Router);

  return next(withToken(request, auth.token())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          void router.navigate([APP_ROUTES.LOGIN], {
            queryParams: { returnUrl: router.url, expired: 1 },
          });
          return throwError(() => refreshError);
        }),
        switchMap((token) => next(withToken(request, token))),
      );
    }),
  );
};
