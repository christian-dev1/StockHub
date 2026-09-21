import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageStore } from '../i18n/language-store';

/** Lets the backend localize its error messages. */
export const acceptLanguageInterceptor: HttpInterceptorFn = (request, next) => {
  const language = inject(LanguageStore).language();
  return next(request.clone({ setHeaders: { 'Accept-Language': language } }));
};
