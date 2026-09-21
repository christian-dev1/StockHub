import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { AppError } from '../../core/errors/app-error';
import { ErrorMessages } from '../utils/error-message';

/** Toast notifications with translated texts. */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly errors = inject(ErrorMessages);

  success(key: string, params?: Record<string, unknown>): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(key, params) as string,
      life: 4000,
    });
  }

  error(error: AppError): void {
    this.messages.add({ severity: 'error', summary: this.errors.of(error), life: 6000 });
  }
}
