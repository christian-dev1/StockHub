import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppError } from '../../core/errors/app-error';

/**
 * Turns an {@link AppError} into a user message: frontend translation of the
 * backend code first, then the (already localized) backend message, then a
 * generic message per error kind. Never shows technical details.
 */
@Injectable({ providedIn: 'root' })
export class ErrorMessages {
  private readonly translate = inject(TranslateService);

  of(error: AppError): string {
    const key = `errors.api.${error.code}`;
    const translated = this.translate.instant(key) as string;
    if (translated !== key) {
      return translated;
    }
    if (error.message && error.kind !== 'server' && error.kind !== 'network') {
      return error.message;
    }
    return this.translate.instant(`errors.kind.${error.kind}`) as string;
  }
}
