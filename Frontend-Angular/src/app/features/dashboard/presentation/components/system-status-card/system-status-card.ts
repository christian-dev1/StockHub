import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SkeletonModule } from 'primeng/skeleton';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { LoadState } from '../../../../../shared/utils/load-state';
import { SystemHealth } from '../../../domain/entities/system-health';

@Component({
  selector: 'app-system-status-card',
  imports: [DatePipe, TranslatePipe, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sh-card p-5" aria-labelledby="system-status-title" aria-live="polite">
      <div class="flex items-start justify-between gap-4">
        <h2 id="system-status-title" class="text-sm font-medium text-fg-muted">
          {{ 'dashboard.system.title' | translate }}
        </h2>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg"
          [attr.aria-label]="'common.refresh' | translate"
          (click)="refresh.emit()"
        >
          <i class="pi pi-refresh" aria-hidden="true"></i>
        </button>
      </div>
      @switch (state().status) {
        @case ('success') {
          @if (health(); as h) {
            <p
              class="mt-3 flex items-center gap-2 text-2xl font-semibold"
              [class]="h.status === 'UP' ? 'text-success' : 'text-danger'"
            >
              <i
                [class]="'pi ' + (h.status === 'UP' ? 'pi-check-circle' : 'pi-times-circle')"
                aria-hidden="true"
              ></i>
              {{ 'dashboard.system.status.' + h.status | translate }}
            </p>
            <p class="mt-1 text-xs text-fg-muted">
              {{ 'dashboard.system.checkedAt' | translate }}
              {{ h.checkedAt | date: 'mediumTime' : undefined : locale() }}
            </p>
          }
        }
        @case ('error') {
          <p class="mt-3 flex items-center gap-2 text-base font-medium text-danger" role="alert">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
            {{ 'dashboard.system.unreachable' | translate }}
          </p>
        }
        @default {
          <div class="mt-3 space-y-2" [attr.aria-label]="'common.loading' | translate">
            <p-skeleton width="8rem" height="2rem" />
            <p-skeleton width="10rem" height="0.75rem" />
          </div>
        }
      }
    </section>
  `,
})
export class SystemStatusCard {
  readonly state = input.required<LoadState<SystemHealth>>();
  readonly refresh = output<void>();

  private readonly language = inject(LanguageStore);
  protected readonly locale = computed(() => this.language.locale());
  protected readonly health = computed(() => {
    const state = this.state();
    return state.status === 'success' ? state.data : null;
  });
}
