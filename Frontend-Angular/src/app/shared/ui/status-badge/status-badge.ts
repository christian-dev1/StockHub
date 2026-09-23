import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-fg-muted ring-border',
  success: 'bg-success/10 text-success ring-success/30',
  warning: 'bg-warning/10 text-warning ring-warning/30',
  danger: 'bg-danger/10 text-danger ring-danger/30',
  info: 'bg-info/10 text-info ring-info/30',
  primary: 'bg-primary/10 text-primary ring-primary/30',
};

/** Pill for statuses; always pairs color with a text label (never color alone). */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap"
      [class]="classes[tone()]"
    >
      <span class="size-1 rounded-full bg-current" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
})
export class StatusBadge {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone>('neutral');
  protected readonly classes = TONES;
}
