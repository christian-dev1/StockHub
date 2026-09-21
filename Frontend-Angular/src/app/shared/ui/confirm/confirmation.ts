import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';

export interface ConfirmOptions {
  readonly titleKey: string;
  readonly messageKey: string;
  readonly params?: Record<string, unknown>;
  readonly acceptKey?: string;
  readonly destructive?: boolean;
}

/** Promise-based confirmation before destructive or sensitive actions. */
@Injectable({ providedIn: 'root' })
export class Confirmation {
  private readonly confirmation = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmation.confirm({
        header: this.translate.instant(options.titleKey, options.params) as string,
        message: this.translate.instant(options.messageKey, options.params) as string,
        icon: options.destructive ? 'pi pi-exclamation-triangle' : 'pi pi-question-circle',
        acceptLabel: this.translate.instant(options.acceptKey ?? 'common.confirm') as string,
        rejectLabel: this.translate.instant('common.cancel') as string,
        acceptButtonStyleClass: options.destructive ? 'p-button-danger' : undefined,
        rejectButtonStyleClass: 'p-button-text',
        defaultFocus: 'reject',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }
}
