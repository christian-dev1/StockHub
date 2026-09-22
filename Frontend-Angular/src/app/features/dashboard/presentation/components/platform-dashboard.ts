import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { APP_ROUTES } from '../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../core/i18n/language-store';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { QuantityPipe } from '../../../../shared/pipes/quantity.pipe';
import { PeriodCode } from '../../domain/entities/dashboard';
import { DashboardStore } from '../state/dashboard.store';
import { PlatformDashboardStore } from '../state/platform-dashboard.store';
import { SystemStatusCard } from './system-status-card/system-status-card';
import { BarChart, ChartPoint, ChartSeries } from './bar-chart';
import { DashboardFiltersBar } from './dashboard-filters';
import { KpiCard } from './kpi-card';
import { WidgetCard } from './widget-card';

type PlatformMetric = 'newCompanies' | 'operations';

/** Health of the whole platform (super admin). Days are UTC days. */
@Component({
  selector: 'app-platform-dashboard',
  imports: [
    TranslatePipe,
    DateTimePipe,
    QuantityPipe,
    BarChart,
    DashboardFiltersBar,
    KpiCard,
    WidgetCard,
    SystemStatusCard,
  ],
  providers: [PlatformDashboardStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let d = store.dashboard.data();
    <div class="mb-6">
      <app-dashboard-filters
        [filters]="{ period: store.period(), from: null, to: null, locationId: null }"
        [periods]="periods"
        today=""
        (filtersChange)="$event.period && store.setPeriod($event.period)"
      />
    </div>

    @if (store.dashboard.error() && !d) {
      <app-widget-card
        [title]="'dashboard.sections.kpis' | translate"
        [error]="store.dashboard.error()"
        (retry)="store.load()"
      />
    } @else {
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <app-kpi-card
          icon="pi-building"
          tone="primary"
          testId="kpi-companies"
          [label]="'dashboard.platform.companies' | translate"
          [value]="d ? (d.totals.companies | quantity) : null"
          [hint]="
            d
              ? ('dashboard.platform.companiesHint'
                | translate
                  : { active: d.totals.activeCompanies, disabled: d.totals.disabledCompanies })
              : ''
          "
          [link]="routes.PLATFORM.COMPANIES"
        />
        <app-kpi-card
          icon="pi-users"
          testId="kpi-users"
          [label]="'dashboard.platform.users' | translate"
          [value]="d ? (d.totals.users | quantity) : null"
          [hint]="
            d ? ('dashboard.platform.usersHint' | translate: { active: d.totals.activeUsers }) : ''
          "
        />
        <app-kpi-card
          icon="pi-box"
          testId="kpi-platform-products"
          [label]="'dashboard.platform.products' | translate"
          [value]="d ? (d.totals.products | quantity) : null"
          [hint]="
            d ? ('dashboard.platform.locationsHint' | translate: { count: d.totals.locations }) : ''
          "
        />
        <app-kpi-card
          icon="pi-history"
          testId="kpi-platform-operations"
          [label]="'dashboard.platform.operationsToday' | translate"
          [value]="d ? (d.totals.operationsToday | quantity) : null"
          [hint]="'dashboard.platform.utc' | translate"
        />
      </div>
    }

    <div class="mt-6 grid gap-4 lg:grid-cols-3">
      <app-widget-card
        class="lg:col-span-2"
        [title]="'dashboard.platform.activityTitle' | translate"
        [subtitle]="'dashboard.platform.utc' | translate"
        [loading]="store.dashboard.loading()"
        [error]="store.dashboard.error()"
        [hasData]="!!d"
        (retry)="store.load()"
      >
        <div
          actions
          role="group"
          [attr.aria-label]="'dashboard.platform.metric' | translate"
          class="flex gap-1"
        >
          @for (option of metrics; track option) {
            <button
              type="button"
              [attr.aria-pressed]="metric() === option"
              class="min-h-9 rounded-md px-2.5 text-xs font-medium"
              [class]="
                metric() === option
                  ? 'bg-primary text-primary-fg'
                  : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
              "
              (click)="metric.set(option)"
            >
              {{ 'dashboard.platform.' + option | translate }}
            </button>
          }
        </div>
        @if (d) {
          <app-bar-chart
            [points]="points()"
            [series]="series()"
            [granularity]="d.period.granularity"
            [ariaLabel]="series()[0].label"
          />
        }
      </app-widget-card>
      <app-system-status-card [state]="health.health()" (refresh)="health.loadHealth()" />
    </div>

    <div class="mt-4">
      <app-widget-card
        [title]="'dashboard.platform.eventsTitle' | translate"
        [loading]="store.dashboard.loading()"
        [error]="store.dashboard.error()"
        [hasData]="!!d"
        [empty]="d?.recentEvents?.length === 0"
        [emptyTitle]="'dashboard.platform.eventsEmpty' | translate"
        (retry)="store.load()"
      >
        @if (d) {
          <ol class="divide-y divide-border" data-testid="platform-events">
            @for (event of d.recentEvents; track event.id) {
              <li class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5 text-sm">
                <span class="w-32 shrink-0 text-xs text-fg-muted">{{
                  event.occurredAt | dateTime: 'short'
                }}</span>
                <span class="min-w-0 flex-1 font-medium text-fg">{{
                  actionLabel(event.action)
                }}</span>
                <span class="text-xs text-fg-muted">
                  {{ event.companyName ?? ('dashboard.platform.platformScope' | translate) }}
                  · {{ event.actor ?? ('dashboard.platform.system' | translate) }}
                </span>
              </li>
            }
          </ol>
        }
      </app-widget-card>
    </div>
  `,
})
export class PlatformDashboardView implements OnInit {
  protected readonly store = inject(PlatformDashboardStore);
  protected readonly health = inject(DashboardStore);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);
  protected readonly routes = APP_ROUTES;
  protected readonly periods: readonly PeriodCode[] = ['7D', '30D', '3M', '1Y'];
  protected readonly metrics: readonly PlatformMetric[] = ['newCompanies', 'operations'];
  protected readonly metric = signal<PlatformMetric>('newCompanies');

  protected readonly points = computed<ChartPoint[]>(() =>
    (this.store.dashboard.data()?.activity ?? []).map((a) => ({
      bucket: a.bucket,
      values: [a[this.metric()]],
    })),
  );
  protected readonly series = computed<ChartSeries[]>(() => {
    this.language.language();
    return [
      {
        label: this.translate.instant(`dashboard.platform.${this.metric()}`) as string,
        color: 'bg-series-1',
        fill: 'fill-series-1',
        testId: 'platform-chart-total',
      },
    ];
  });

  ngOnInit(): void {
    this.store.load();
    this.health.loadHealth();
  }

  protected actionLabel(action: string): string {
    this.language.language();
    const key = `dashboard.platform.actions.${action}`;
    const label = this.translate.instant(key) as string;
    return label === key ? action : label;
  }
}
