import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SkeletonModule } from 'primeng/skeleton';
import { AppError } from '../../../../core/errors/app-error';
import { ErrorState } from '../../../../shared/ui/error-state/error-state';

let nextId = 0;

/**
 * Frame of a dashboard widget: title, optional header actions, and the four
 * states. Content is shown once data exists; while a refresh runs, the
 * previous content stays (dimmed) instead of flashing a skeleton.
 */
@Component({
  selector: 'app-widget-card',
  imports: [TranslatePipe, SkeletonModule, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <section
      class="sh-card flex h-full min-w-0 flex-col p-4 sm:p-5"
      [attr.aria-labelledby]="id + '-title'"
      [attr.aria-busy]="loading()"
    >
      <header class="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <h2 [id]="id + '-title'" class="text-base font-semibold text-fg">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="mt-0.5 text-xs text-fg-muted">{{ subtitle() }}</p>
          }
        </div>
        <ng-content select="[actions]" />
      </header>
      @if (error() && !hasData()) {
        <app-error-state [error]="error()!" (retry)="retry.emit()" />
      } @else if (loading() && !hasData()) {
        <div class="space-y-3" aria-hidden="true">
          <p-skeleton height="1.25rem" width="60%" />
          <p-skeleton height="1.25rem" />
          <p-skeleton height="1.25rem" width="80%" />
        </div>
        <span class="sr-only">{{ 'common.loading' | translate }}</span>
      } @else if (empty()) {
        <div
          class="flex flex-1 flex-col items-center justify-center py-6 text-center"
          role="status"
        >
          <i class="pi pi-inbox mb-2 text-xl text-fg-muted" aria-hidden="true"></i>
          <p class="text-sm font-medium text-fg">{{ emptyTitle() }}</p>
          @if (emptyHint()) {
            <p class="mt-1 max-w-xs text-xs text-fg-muted">{{ emptyHint() }}</p>
          }
        </div>
      } @else {
        <div class="min-w-0 flex-1 transition-opacity" [class.opacity-60]="loading()">
          <ng-content />
        </div>
        @if (error()) {
          <p class="mt-3 text-xs text-danger" role="alert">
            {{ 'dashboard.widget.refreshFailed' | translate }}
            <button type="button" class="ml-1 underline" (click)="retry.emit()">
              {{ 'common.retry' | translate }}
            </button>
          </p>
        }
      }
    </section>
  `,
})
export class WidgetCard {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly loading = input(false);
  readonly error = input<AppError | null>(null);
  readonly hasData = input(false);
  readonly empty = input(false);
  readonly emptyTitle = input('');
  readonly emptyHint = input<string>();
  readonly retry = output<void>();

  protected readonly id = `widget-${nextId++}`;
}
