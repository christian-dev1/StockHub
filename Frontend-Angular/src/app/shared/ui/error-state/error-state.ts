import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppError } from '../../../core/errors/app-error';
import { ErrorMessages } from '../../utils/error-message';

/** Inline error block with retry; shows the request id to help support. */
@Component({
  selector: 'app-error-state',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="alert" class="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span
        class="mb-3 flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger"
      >
        <i class="pi pi-exclamation-triangle text-xl" aria-hidden="true"></i>
      </span>
      <p class="font-medium text-fg">{{ message() }}</p>
      @if (error().requestId) {
        <p class="mt-1 text-xs text-fg-muted">
          {{ 'errors.reference' | translate }} {{ error().requestId }}
        </p>
      }
      @if (retryable()) {
        <button
          type="button"
          (click)="retry.emit()"
          class="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-fg hover:bg-surface-muted"
        >
          <i class="pi pi-refresh" aria-hidden="true"></i>
          {{ 'common.retry' | translate }}
        </button>
      }
    </div>
  `,
})
export class ErrorState {
  readonly error = input.required<AppError>();
  readonly retryable = input(true);
  readonly retry = output<void>();
  private readonly messages = inject(ErrorMessages);
  protected readonly message = computed(() => this.messages.of(this.error()));
}
