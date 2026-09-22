import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';

export type KpiTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const ICON_TONES: Record<KpiTone, string> = {
  neutral: 'bg-surface-muted text-fg-muted',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

/**
 * One key figure: icon, label, value and an optional secondary line. With a
 * link, the whole card leads to the matching list (e.g. "Low stock" → stock
 * filtered on low stock). No trend is shown unless the backend computed one.
 */
@Component({
  selector: 'app-kpi-card',
  imports: [RouterLink, NgTemplateOutlet, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <ng-template #body>
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-lg"
        [class]="tones[tone()]"
        aria-hidden="true"
      >
        <i [class]="'pi ' + icon()"></i>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm text-fg-muted">{{ label() }}</span>
        @if (value() === null) {
          <p-skeleton width="4rem" height="1.75rem" styleClass="mt-1" />
        } @else {
          <span
            class="mt-0.5 block truncate text-2xl font-semibold tabular-nums text-fg"
            [attr.data-testid]="testId()"
            >{{ value() }}</span
          >
        }
        @if (hint()) {
          <span class="mt-0.5 block truncate text-xs text-fg-muted">{{ hint() }}</span>
        }
      </span>
      @if (link()) {
        <i class="pi pi-angle-right self-center text-fg-muted" aria-hidden="true"></i>
      }
    </ng-template>
    @if (link(); as target) {
      <a
        [routerLink]="target"
        [queryParams]="queryParams()"
        class="sh-card flex h-full items-start gap-3 p-4 no-underline transition-colors hover:border-primary/40 hover:bg-surface-muted/40"
      >
        <ng-container *ngTemplateOutlet="body" />
      </a>
    } @else {
      <div class="sh-card flex h-full items-start gap-3 p-4">
        <ng-container *ngTemplateOutlet="body" />
      </div>
    }
  `,
})
export class KpiCard {
  readonly label = input.required<string>();
  /** Already formatted; null while loading. */
  readonly value = input.required<string | null>();
  readonly icon = input.required<string>();
  readonly hint = input<string>();
  readonly tone = input<KpiTone>('neutral');
  readonly link = input<string | null>(null);
  readonly queryParams = input<Record<string, string> | null>(null);
  readonly testId = input<string | null>(null);

  protected readonly tones = ICON_TONES;
}
