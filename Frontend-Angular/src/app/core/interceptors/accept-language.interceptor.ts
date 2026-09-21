import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_ROUTES } from '../config/routes/api.routes';
import { LanguageStore } from '../i18n/language-store';

/**
 * Lets the backend localize its error messages. Only API calls are touched:
 * the translation files themselves are loaded while LanguageStore is being
 * created, and injecting it there would be a circular dependency (NG0200).
 */
export const acceptLanguageInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_ROUTES.BASE)) {
    return next(request);
  }
  const language = inject(LanguageStore).language();
  return next(request.clone({ setHeaders: { 'Accept-Language': language } }));
};
