import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_ROUTES } from '../../../../core/config/routes/app.routes';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { QuantityPipe } from '../../../../shared/pipes/quantity.pipe';
import { DashboardSummary, LocationStock, statusShares } from '../../domain/entities/dashboard';

/**
 * Stock state as one proportional bar plus a legend that repeats each count
 * with an icon and a label (status colours never stand alone). Each row links
 * to the stock list filtered on that state.
 */
@Component({
  selector: 'app-status-breakdown',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-surface-muted"
      role="img"
      [attr.aria-label]="'dashboard.status.aria' | translate: status()"
    >
      @if (shares().normal > 0) {
        <span class="h-full rounded-full bg-success" [style.width.%]="shares().normal"></span>
      }
      @if (shares().low > 0) {
        <span class="h-full rounded-full bg-warning" [style.width.%]="shares().low"></span>
      }
      @if (shares().out > 0) {
        <span class="h-full rounded-full bg-danger" [style.width.%]="shares().out"></span>
      }
    </div>
    <ul class="mt-4 divide-y divide-border text-sm">
      @for (row of rows(); track row.key) {
        <li>
          <a
            [routerLink]="routes.STOCK.ROOT"
            [queryParams]="row.query"
            class="flex min-h-11 items-center gap-3 py-2 text-fg no-underline hover:text-primary"
          >
            <i [class]="'pi ' + row.icon + ' ' + row.tone" aria-hidden="true"></i>
            <span class="flex-1">{{ 'dashboard.status.' + row.key | translate }}</span>
            <span class="font-semibold tabular-nums" [attr.data-testid]="'status-' + row.key">{{
              row.count
            }}</span>
            <span class="w-12 text-right text-xs tabular-nums text-fg-muted"
              >{{ row.share }} %</span
            >
          </a>
        </li>
      }
    </ul>
    <p class="mt-2 text-xs text-fg-muted">{{ 'dashboard.status.explanation' | translate }}</p>
  `,
})
export class StatusBreakdown {
  readonly status = input.required<DashboardSummary['status']>();
  protected readonly routes = APP_ROUTES;
  protected readonly shares = computed(() => statusShares(this.status()));
  protected readonly rows = computed(() => {
    const status = this.status();
    const shares = this.shares();
    return [
      {
        key: 'normal',
        count: status.normal,
        share: shares.normal,
        icon: 'pi-check-circle',
        tone: 'text-success',
        query: null,
      },
      {
        key: 'low',
        count: status.low,
        share: shares.low,
        icon: 'pi-exclamation-triangle',
        tone: 'text-warning',
        query: { state: 'LOW' },
      },
      {
        key: 'out',
        count: status.out,
        share: shares.out,
        icon: 'pi-ban',
        tone: 'text-danger',
        query: { state: 'OUT' },
      },
    ];
  });
}

/**
 * Stock per location as horizontal bars (one series, so no legend): the
 * stock value when the user may see it, otherwise the number of products in
 * stock. The metric is named above the bars.
 */
@Component({
  selector: 'app-location-bars',
  imports: [TranslatePipe, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="mb-3 text-xs text-fg-muted">
      {{
        (financial() ? 'dashboard.locations.byValue' : 'dashboard.locations.byReferences')
          | translate
      }}
    </p>
    <ul class="space-y-3">
      @for (row of rows(); track row.locationId) {
        <li class="text-sm">
          <div class="mb-1 flex items-baseline justify-between gap-3">
            <span class="truncate text-fg">{{ row.name }}</span>
            <span class="shrink-0 font-semibold tabular-nums text-fg">
              @if (financial()) {
                {{ row.stockValue | money: currency() }}
              } @else {
                {{ 'dashboard.locations.references' | translate: { count: row.referencesInStock } }}
              }
            </span>
          </div>
          <div class="h-2.5 w-full rounded-full bg-surface-muted" aria-hidden="true">
            <div class="h-full rounded-full bg-series-1" [style.width.%]="row.share"></div>
          </div>
        </li>
      }
    </ul>
  `,
})
export class LocationBars {
  readonly locations = input.required<readonly LocationStock[]>();
  readonly financial = input(false);
  readonly currency = input('XAF');

  protected readonly rows = computed(() => {
    const metric = (l: LocationStock) =>
      this.financial() ? (l.stockValue ?? 0) : l.referencesInStock;
    const max = Math.max(0, ...this.locations().map(metric));
    return this.locations().map((l) => ({
      ...l,
      share: max > 0 ? Math.max(1, (metric(l) / max) * 100) : 0,
    }));
  });
}

/** "Batches to watch": counts by urgency and the most urgent batches. */
@Component({
  selector: 'app-batch-watch',
  imports: [RouterLink, TranslatePipe, QuantityPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="grid grid-cols-3 gap-2 text-center">
      <div class="rounded-lg bg-danger/10 p-2">
        <dt class="text-xs text-fg-muted">{{ 'dashboard.batches.expired' | translate }}</dt>
        <dd class="text-xl font-semibold tabular-nums text-danger">{{ batches().expired }}</dd>
      </div>
      <div class="rounded-lg bg-warning/10 p-2">
        <dt class="text-xs text-fg-muted">{{ 'dashboard.batches.week' | translate }}</dt>
        <dd class="text-xl font-semibold tabular-nums text-warning">
          {{ batches().expiringWithin7Days }}
        </dd>
      </div>
      <div class="rounded-lg bg-surface-muted p-2">
        <dt class="text-xs text-fg-muted">
          {{ 'dashboard.batches.soon' | translate: { days: batches().warningDays } }}
        </dt>
        <dd class="text-xl font-semibold tabular-nums text-fg">{{ batches().expiringSoon }}</dd>
      </div>
    </dl>
    @if (list().length > 0) {
      <ul class="mt-4 divide-y divide-border text-sm">
        @for (batch of list(); track batch.batchId) {
          <li class="flex items-center gap-3 py-2">
            <i
              class="pi"
              [class.pi-times-circle]="batch.expired"
              [class.text-danger]="batch.expired"
              [class.pi-clock]="!batch.expired"
              [class.text-warning]="!batch.expired"
              aria-hidden="true"
            ></i>
            <div class="min-w-0 flex-1">
              <p class="truncate text-fg">{{ batch.productName }}</p>
              <p class="truncate text-xs text-fg-muted">
                <span class="font-mono">{{ batch.batchNumber }}</span> · {{ batch.locationName }}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-xs" [class.text-danger]="batch.expired">
                {{
                  (batch.expired ? 'dashboard.batches.expiredOn' : 'dashboard.batches.expiresOn')
                    | translate: { date: batch.date }
                }}
              </p>
              <p class="text-xs tabular-nums text-fg-muted">{{ batch.quantity | quantity }}</p>
            </div>
          </li>
        }
      </ul>
    }
    <a
      [routerLink]="routes.STOCK.BATCHES"
      class="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
      >{{ 'dashboard.batches.all' | translate }}<i class="pi pi-angle-right" aria-hidden="true"></i
    ></a>
  `,
})
export class BatchWatch {
  readonly batches = input.required<DashboardSummary['batches']>();
  readonly attention = input.required<DashboardSummary['attention']>();
  readonly locale = input('fr-FR');
  protected readonly routes = APP_ROUTES;
  protected readonly list = computed(() => {
    const format = new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium', timeZone: 'UTC' });
    const date = (day: string) => format.format(new Date(`${day}T00:00:00Z`));
    return [
      ...this.attention().expiredBatches.map((b) => ({ ...b, expired: true })),
      ...this.attention().expiringBatches.map((b) => ({ ...b, expired: false })),
    ]
      .slice(0, 5)
      .map((b) => ({ ...b, date: date(b.expirationDate) }));
  });
}
