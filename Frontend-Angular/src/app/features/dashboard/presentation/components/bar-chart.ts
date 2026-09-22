import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageStore } from '../../../../core/i18n/language-store';
import { QuantityPipe } from '../../../../shared/pipes/quantity.pipe';
import { bucketLabel, labelIndexes, niceScale } from '../../domain/entities/chart';
import { Granularity } from '../../domain/entities/dashboard';

/** One bar series: label, Tailwind background class (legend) and its SVG fill class. */
export interface ChartSeries {
  readonly label: string;
  readonly color: string;
  readonly fill: string;
  readonly testId?: string;
}

/** One bucket: a value per series and an optional secondary figure (quantities) per series. */
export interface ChartPoint {
  readonly bucket: string;
  readonly values: readonly number[];
  readonly details?: readonly (number | null)[];
}

const HEIGHT = 220;
const AXIS_LEFT = 32;
const AXIS_BOTTOM = 8;
const TOP = 8;
const BAR_GAP = 2;
const RADIUS = 4;

/**
 * Grouped bars over time (e.g. entries vs exits). Colours are the validated
 * series tokens; identity is never colour-alone (legend with totals, tooltip,
 * table view). Hover or arrow keys show a bucket. One value axis only: never
 * mix measures of different scales in one chart.
 */
@Component({
  selector: 'app-bar-chart',
  imports: [TranslatePipe, QuantityPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div class="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      @for (serie of series(); track serie.label; let si = $index) {
        <span class="inline-flex items-center gap-2 text-fg">
          @if (series().length > 1) {
            <span class="size-3 rounded-sm" [class]="serie.color" aria-hidden="true"></span>
          }
          {{ serie.label }}
          <span class="font-semibold tabular-nums" [attr.data-testid]="serie.testId">{{
            totals()[si]
          }}</span>
        </span>
      }
      <button
        type="button"
        class="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
        [attr.aria-pressed]="showTable()"
        (click)="showTable.set(!showTable())"
      >
        <i
          class="pi"
          [class.pi-table]="!showTable()"
          [class.pi-chart-bar]="showTable()"
          aria-hidden="true"
        ></i>
        {{ (showTable() ? 'dashboard.chart.showChart' : 'dashboard.chart.showTable') | translate }}
      </button>
    </div>

    @if (showTable()) {
      <div class="max-h-72 overflow-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            {{
              ariaLabel()
            }}
          </caption>
          <thead class="sticky top-0 bg-surface text-xs uppercase tracking-wide text-fg-muted">
            <tr>
              <th scope="col" class="py-2 pr-3 font-semibold">
                {{ 'dashboard.chart.bucket' | translate }}
              </th>
              @for (serie of series(); track serie.label) {
                <th scope="col" class="py-2 pr-3 text-right font-semibold">{{ serie.label }}</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            @for (bar of bars(); track bar.bucket) {
              <tr>
                <th scope="row" class="py-1.5 pr-3 font-normal text-fg">{{ bar.longLabel }}</th>
                @for (value of bar.values; track $index; let si = $index) {
                  <td class="py-1.5 pr-3 text-right tabular-nums">
                    {{ value }}
                    @if (bar.details[si] !== null) {
                      <span class="text-xs text-fg-muted">({{ bar.details[si] | quantity }})</span>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div #plot class="relative w-full select-none" [style.height.px]="height">
        @if (width() > 0) {
          <svg
            [attr.width]="width()"
            [attr.height]="height"
            role="img"
            [attr.aria-label]="ariaLabel()"
            tabindex="0"
            class="block rounded focus-visible:outline-2 focus-visible:outline-focus"
            (keydown)="onKey($event)"
            (blur)="active.set(null)"
            (mouseleave)="active.set(null)"
          >
            @for (tick of scale().ticks; track tick) {
              <line
                [attr.x1]="axisLeft"
                [attr.x2]="width()"
                [attr.y1]="y(tick)"
                [attr.y2]="y(tick)"
                class="stroke-chart-grid"
                stroke-width="1"
              />
              <text
                [attr.x]="axisLeft - 6"
                [attr.y]="y(tick)"
                text-anchor="end"
                dominant-baseline="middle"
                class="fill-fg-muted text-[11px] tabular-nums"
              >
                {{ tick }}
              </text>
            }
            @for (bar of bars(); track bar.bucket; let i = $index) {
              @if (active() === i) {
                <rect
                  [attr.x]="bar.x"
                  [attr.y]="top"
                  [attr.width]="bar.slot"
                  [attr.height]="plotHeight"
                  class="fill-surface-muted"
                />
              }
              @for (path of bar.paths; track $index; let si = $index) {
                <path [attr.d]="path" [class]="fills()[si]" />
              }
              <rect
                [attr.x]="bar.x"
                [attr.y]="top"
                [attr.width]="bar.slot"
                [attr.height]="plotHeight"
                fill="transparent"
                (mouseenter)="active.set(i)"
              />
            }
          </svg>
          @if (activeBar(); as bar) {
            <div
              class="pointer-events-none absolute z-10 min-w-40 -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
              [style.left.px]="tooltipLeft()"
              [style.top.px]="0"
              role="status"
            >
              <p class="mb-1 font-semibold text-fg">{{ bar.longLabel }}</p>
              @for (serie of series(); track serie.label; let si = $index) {
                <p class="flex items-center justify-between gap-3 text-fg">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="size-2 rounded-sm" [class]="serie.color" aria-hidden="true"></span>
                    {{ serie.label }}
                  </span>
                  <span class="tabular-nums">
                    <strong>{{ bar.values[si] }}</strong>
                    @if (bar.details[si] !== null) {
                      <span class="text-fg-muted">
                        · {{ bar.details[si] | quantity }}
                        {{ 'dashboard.chart.units' | translate }}</span
                      >
                    }
                  </span>
                </p>
              }
            </div>
          }
        }
      </div>
      <div class="relative mt-1 h-5 overflow-hidden text-[11px] text-fg-muted" aria-hidden="true">
        @for (bar of bars(); track bar.bucket; let i = $index) {
          @if (visibleLabels().has(i)) {
            <span
              class="absolute -translate-x-1/2 whitespace-nowrap"
              [style.left.px]="labelLeft(i)"
              >{{ bar.label }}</span
            >
          }
        }
      </div>
      @if (note()) {
        <p class="mt-2 text-xs text-fg-muted">{{ note() }}</p>
      }
    }
  `,
})
export class BarChart {
  readonly points = input.required<readonly ChartPoint[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly granularity = input.required<Granularity>();
  /** Accessible summary of the chart (the SVG is one image). */
  readonly ariaLabel = input.required<string>();
  readonly note = input<string>();

  private readonly language = inject(LanguageStore);
  private readonly plot = viewChild<ElementRef<HTMLElement>>('plot');

  protected readonly height = HEIGHT;
  protected readonly top = TOP;
  protected readonly axisLeft = AXIS_LEFT;
  protected readonly plotHeight = HEIGHT - TOP - AXIS_BOTTOM;
  protected readonly width = signal(0);
  protected readonly active = signal<number | null>(null);
  protected readonly showTable = signal(false);

  protected readonly fills = computed(() => this.series().map((serie) => serie.fill));
  protected readonly totals = computed(() =>
    this.series().map((_, si) =>
      this.points().reduce((sum, point) => sum + (point.values[si] ?? 0), 0),
    ),
  );
  protected readonly scale = computed(() =>
    niceScale(Math.max(0, ...this.points().flatMap((p) => p.values))),
  );

  protected readonly bars = computed(() => {
    const points = this.points();
    const count = Math.max(1, this.series().length);
    const locale = this.language.locale();
    const granularity = this.granularity();
    const plotWidth = Math.max(0, this.width() - AXIS_LEFT);
    const slot = points.length ? plotWidth / points.length : 0;
    const barWidth = Math.max(2, Math.min(18, (slot * 0.72 - BAR_GAP * (count - 1)) / count));
    const groupWidth = count * barWidth + (count - 1) * BAR_GAP;
    return points.map((point, i) => {
      const x = AXIS_LEFT + i * slot;
      const start = x + (slot - groupWidth) / 2;
      return {
        bucket: point.bucket,
        values: point.values,
        details: point.values.map((_, si) => point.details?.[si] ?? null),
        x,
        slot,
        label: bucketLabel(point.bucket, granularity, locale),
        longLabel: bucketLabel(point.bucket, granularity, locale, true),
        paths: point.values.map((value, si) =>
          this.barPath(start + si * (barWidth + BAR_GAP), barWidth, value),
        ),
      };
    });
  });
  protected readonly visibleLabels = computed(() =>
    labelIndexes(this.bars().length, Math.max(2, Math.floor(this.width() / 72))),
  );
  protected readonly activeBar = computed(() => {
    const index = this.active();
    return index === null ? null : (this.bars()[index] ?? null);
  });
  protected readonly tooltipLeft = computed(() => {
    const bar = this.activeBar();
    if (!bar) return 0;
    const half = 90;
    return Math.min(Math.max(bar.x + bar.slot / 2, half), this.width() - half);
  });

  /** Axis label centre, kept inside the plot so a phone never scrolls sideways. */
  protected labelLeft(index: number): number {
    const bar = this.bars()[index];
    if (!bar) return 0;
    const half = 34;
    const center = bar.x + bar.slot / 2;
    return Math.min(Math.max(center, half), Math.max(half, this.width() - half));
  }

  constructor() {
    // The plot element is recreated when leaving the table view: observe each one.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => this.width.set(entries[0]?.contentRect.width ?? 0));
    effect(() => {
      const element = this.plot()?.nativeElement;
      observer?.disconnect();
      if (element) {
        observer?.observe(element);
        this.width.set(element.clientWidth);
      }
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }

  protected y(value: number): number {
    return TOP + this.plotHeight - (value / this.scale().max) * this.plotHeight;
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.bars().length;
    if (!count) return;
    const current = this.active() ?? count;
    if (event.key === 'ArrowRight') this.active.set(Math.min(count - 1, current + 1));
    else if (event.key === 'ArrowLeft') this.active.set(Math.max(0, current - 1));
    else if (event.key === 'Escape') this.active.set(null);
    else return;
    event.preventDefault();
  }

  /** Bar anchored on the baseline with rounded top corners; nothing for zero. */
  private barPath(x: number, width: number, value: number): string {
    if (value <= 0) return '';
    const bottom = TOP + this.plotHeight;
    const height = Math.max(1, (value / this.scale().max) * this.plotHeight);
    const r = Math.min(RADIUS, width / 2, height);
    const topY = bottom - height;
    return (
      `M${x},${bottom} L${x},${topY + r} Q${x},${topY} ${x + r},${topY}` +
      ` L${x + width - r},${topY} Q${x + width},${topY} ${x + width},${topY + r}` +
      ` L${x + width},${bottom} Z`
    );
  }
}
