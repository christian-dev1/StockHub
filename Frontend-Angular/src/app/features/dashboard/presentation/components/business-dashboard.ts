import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { APP_ROUTES } from '../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../core/i18n/language-store';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { QuantityPipe } from '../../../../shared/pipes/quantity.pipe';
import { ChartPoint, ChartSeries } from './bar-chart';
import { BarChart } from './bar-chart';
import { AttentionList, RecentActivity, TopProducts } from './activity-widgets';
import { KpiCard } from './kpi-card';
import { BatchWatch, LocationBars, StatusBreakdown } from './stock-widgets';
import { WidgetCard } from './widget-card';
import { CompanyDashboardStore } from '../state/company-dashboard.store';

/**
 * ADMIN / MANAGER dashboard: stock value and health, entries vs exits, stock
 * per location (multi-site only), what needs handling and recent activity.
 * Sales figures are deliberately absent until a sale module exists.
 */
@Component({
  selector: 'app-business-dashboard',
  imports: [
    TranslatePipe,
    MoneyPipe,
    QuantityPipe,
    BarChart,
    KpiCard,
    WidgetCard,
    StatusBreakdown,
    LocationBars,
    BatchWatch,
    AttentionList,
    RecentActivity,
    TopProducts,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = store.summary.data();
    <h2 class="sr-only">{{ 'dashboard.sections.kpis' | translate }}</h2>
    @if (store.summary.error() && !s) {
      <app-widget-card
        class="mb-6"
        [title]="'dashboard.sections.kpis' | translate"
        [error]="store.summary.error()"
        (retry)="store.reloadSummary()"
      />
    } @else {
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <app-kpi-card
          icon="pi-wallet"
          tone="primary"
          testId="kpi-stock-value"
          [label]="'dashboard.kpi.stockValue' | translate"
          [value]="s ? (s.catalogue.stockValue | money: s.catalogue.currency) : null"
          [hint]="'dashboard.kpi.stockValueHint' | translate"
        />
        <app-kpi-card
          icon="pi-box"
          testId="kpi-products"
          [label]="'dashboard.kpi.products' | translate"
          [value]="s ? (s.catalogue.activeProducts | quantity) : null"
          [hint]="
            s
              ? ('dashboard.kpi.productsHint' | translate: { count: s.catalogue.referencesInStock })
              : ''
          "
          [link]="routes.PRODUCTS.ROOT"
        />
        <app-kpi-card
          icon="pi-database"
          testId="kpi-quantity"
          [label]="'dashboard.kpi.quantity' | translate"
          [value]="s ? (s.catalogue.totalQuantity | quantity) : null"
          [hint]="'dashboard.kpi.quantityHint' | translate"
        />
        <app-kpi-card
          icon="pi-exclamation-triangle"
          tone="warning"
          testId="kpi-low"
          [label]="'dashboard.kpi.low' | translate"
          [value]="s ? (s.status.low | quantity) : null"
          [link]="routes.STOCK.ROOT"
          [queryParams]="{ state: 'LOW' }"
        />
        <app-kpi-card
          icon="pi-ban"
          tone="danger"
          testId="kpi-out"
          [label]="'dashboard.kpi.out' | translate"
          [value]="s ? (s.status.out | quantity) : null"
          [link]="routes.STOCK.ROOT"
          [queryParams]="{ state: 'OUT' }"
        />
        <app-kpi-card
          icon="pi-calendar-clock"
          tone="warning"
          testId="kpi-expiring"
          [label]="'dashboard.kpi.expiring' | translate"
          [value]="s ? (s.batches.expiringSoon | quantity) : null"
          [hint]="s ? ('dashboard.kpi.expiredHint' | translate: { count: s.batches.expired }) : ''"
          [link]="routes.STOCK.BATCHES"
          [queryParams]="{ status: 'EXPIRING_SOON' }"
        />
      </div>

      <h2 class="mt-6 mb-3 sh-section-title text-fg-muted">
        {{ 'dashboard.sections.activity' | translate }}
      </h2>
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <app-kpi-card
          icon="pi-arrow-down-left"
          tone="success"
          testId="kpi-entries-today"
          [label]="'dashboard.kpi.entriesToday' | translate"
          [value]="s ? (s.activity.today.entries | quantity) : null"
          [hint]="
            s
              ? ('dashboard.kpi.units'
                | translate: { quantity: (s.activity.today.entryQuantity | quantity) })
              : ''
          "
        />
        <app-kpi-card
          icon="pi-arrow-up-right"
          tone="danger"
          testId="kpi-exits-today"
          [label]="'dashboard.kpi.exitsToday' | translate"
          [value]="s ? (s.activity.today.exits | quantity) : null"
          [hint]="
            s
              ? ('dashboard.kpi.units'
                | translate: { quantity: (s.activity.today.exitQuantity | quantity) })
              : ''
          "
        />
        <app-kpi-card
          icon="pi-arrow-down-left"
          testId="kpi-entries-period"
          [label]="'dashboard.kpi.entriesPeriod' | translate"
          [value]="s ? (s.activity.period.entries | quantity) : null"
          [hint]="
            s
              ? ('dashboard.kpi.units'
                | translate: { quantity: (s.activity.period.entryQuantity | quantity) })
              : ''
          "
        />
        <app-kpi-card
          icon="pi-arrow-up-right"
          testId="kpi-exits-period"
          [label]="'dashboard.kpi.exitsPeriod' | translate"
          [value]="s ? (s.activity.period.exits | quantity) : null"
          [hint]="
            s
              ? ('dashboard.kpi.units'
                | translate: { quantity: (s.activity.period.exitQuantity | quantity) })
              : ''
          "
        />
      </div>
    }

    <div class="mt-8 grid gap-4 lg:grid-cols-3">
      <app-widget-card
        class="lg:col-span-2"
        [title]="'dashboard.flow.title' | translate"
        [subtitle]="'dashboard.flow.subtitle' | translate"
        [loading]="store.flow.loading()"
        [error]="store.flow.error()"
        [hasData]="!!store.flow.data()"
        [empty]="flowEmpty()"
        [emptyTitle]="'dashboard.flow.empty' | translate"
        [emptyHint]="'dashboard.flow.emptyHint' | translate"
        (retry)="store.reloadFlow()"
      >
        @if (store.flow.data(); as flow) {
          <app-bar-chart
            [points]="flowPoints()"
            [series]="flowSeries()"
            [granularity]="flow.period.granularity"
            [ariaLabel]="flowLabel()"
            [note]="'dashboard.flow.explanation' | translate"
          />
        }
      </app-widget-card>

      <app-widget-card
        [title]="'dashboard.status.title' | translate"
        [loading]="store.summary.loading()"
        [error]="store.summary.error()"
        [hasData]="!!s"
        [empty]="!!s && s.status.normal + s.status.low + s.status.out === 0"
        [emptyTitle]="'dashboard.status.empty' | translate"
        (retry)="store.reloadSummary()"
      >
        @if (s) {
          <app-status-breakdown [status]="s.status" />
        }
      </app-widget-card>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-3">
      @if (s && s.byLocation.length > 1) {
        <app-widget-card
          [title]="'dashboard.locations.title' | translate"
          [loading]="store.summary.loading()"
          [hasData]="true"
        >
          <app-location-bars
            [locations]="s.byLocation"
            [financial]="s.scope.financial"
            [currency]="s.catalogue.currency"
          />
        </app-widget-card>
      }
      <app-widget-card
        [title]="'dashboard.batches.title' | translate"
        [loading]="store.summary.loading()"
        [error]="store.summary.error()"
        [hasData]="!!s"
        (retry)="store.reloadSummary()"
      >
        @if (s) {
          <app-batch-watch
            [batches]="s.batches"
            [attention]="s.attention"
            [locale]="language.locale()"
          />
        }
      </app-widget-card>
      <app-widget-card
        [title]="'dashboard.top.title' | translate"
        [subtitle]="'dashboard.top.subtitle' | translate"
        [loading]="store.top.loading()"
        [error]="store.top.error()"
        [hasData]="!!store.top.data()"
        [empty]="store.top.data()?.products?.length === 0"
        [emptyTitle]="'dashboard.top.empty' | translate"
        (retry)="store.reloadTop()"
      >
        @if (store.top.data(); as top) {
          <app-top-products [products]="top.products" />
        }
      </app-widget-card>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-2">
      <app-widget-card
        [title]="'dashboard.attention.title' | translate"
        [subtitle]="'dashboard.attention.subtitle' | translate"
        [loading]="store.summary.loading()"
        [error]="store.summary.error()"
        [hasData]="!!s"
        [empty]="attentionEmpty()"
        [emptyTitle]="'dashboard.attention.empty' | translate"
        (retry)="store.reloadSummary()"
      >
        @if (s) {
          <app-attention-list [attention]="s.attention" />
        }
      </app-widget-card>
      <app-widget-card
        [title]="'dashboard.activity.title' | translate"
        [loading]="store.recent.loading()"
        [error]="store.recent.error()"
        [hasData]="!!store.recent.data()"
        [empty]="store.recent.data()?.length === 0"
        [emptyTitle]="'dashboard.activity.empty' | translate"
        [emptyHint]="'dashboard.activity.emptyHint' | translate"
        (retry)="store.loadRecent()"
      >
        @if (store.recent.data(); as recent) {
          <app-recent-activity [operations]="recent" />
        }
      </app-widget-card>
    </div>
  `,
})
export class BusinessDashboard {
  protected readonly store = inject(CompanyDashboardStore);
  protected readonly language = inject(LanguageStore);
  private readonly translate = inject(TranslateService);
  protected readonly routes = APP_ROUTES;

  protected readonly flowPoints = computed<ChartPoint[]>(() =>
    (this.store.flow.data()?.points ?? []).map((p) => ({
      bucket: p.bucket,
      values: [p.entries, p.exits],
      details: [p.entryQuantity, p.exitQuantity],
    })),
  );
  protected readonly flowSeries = computed<ChartSeries[]>(() => {
    this.language.language();
    return [
      {
        label: this.translate.instant('dashboard.flow.entries') as string,
        color: 'bg-series-1',
        fill: 'fill-series-1',
        testId: 'flow-total-entries',
      },
      {
        label: this.translate.instant('dashboard.flow.exits') as string,
        color: 'bg-series-2',
        fill: 'fill-series-2',
        testId: 'flow-total-exits',
      },
    ];
  });
  protected readonly flowEmpty = computed(() =>
    this.flowPoints().every((p) => p.values.every((value) => value === 0)),
  );
  protected readonly flowLabel = computed(() => {
    this.language.language();
    const points = this.flowPoints();
    const entries = points.reduce((sum, p) => sum + p.values[0], 0);
    const exits = points.reduce((sum, p) => sum + p.values[1], 0);
    return this.translate.instant('dashboard.flow.summary', { entries, exits }) as string;
  });
  protected readonly attentionEmpty = computed(() => {
    const a = this.store.summary.data()?.attention;
    return !!a && a.outOfStock.length + a.lowStock.length + a.expiredBatches.length === 0;
  });
}
