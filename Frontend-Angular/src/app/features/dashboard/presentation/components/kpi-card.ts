import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';

export type KpiTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const ICON_TONES: Record<KpiTone, string> = {
  neutral: 'text-fg-muted',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
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
      <span class="flex items-center gap-1.5 text-xs text-fg-muted">
        <i [class]="'pi ' + icon() + ' text-[0.8125rem] ' + tones[tone()]" aria-hidden="true"></i>
        <span class="truncate">{{ label() }}</span>
      </span>
      @if (value() === null) {
        <p-skeleton width="4rem" height="1.5rem" styleClass="mt-1.5" />
      } @else {
        <span
          class="mt-1 block truncate text-kpi tabular-nums text-fg"
          [attr.data-testid]="testId()"
          >{{ value() }}</span
        >
      }
      @if (hint()) {
        <span class="mt-0.5 block truncate text-xs text-fg-muted">{{ hint() }}</span>
      }
    </ng-template>
    @if (link(); as target) {
      <a
        [routerLink]="target"
        [queryParams]="queryParams()"
        class="sh-card flex h-full flex-col items-start gap-0 bg-surface-muted/20 p-3 shadow-none no-underline transition-colors hover:border-primary/40 hover:bg-surface-muted/40"
      >
        <ng-container *ngTemplateOutlet="body" />
      </a>
    } @else {
      <div class="sh-card flex h-full flex-col items-start gap-0 bg-surface-muted/20 p-3 shadow-none">
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
