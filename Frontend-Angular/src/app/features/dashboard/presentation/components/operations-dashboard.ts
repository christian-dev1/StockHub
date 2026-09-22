import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_ROUTES } from '../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../core/i18n/language-store';
import { QuantityPipe } from '../../../../shared/pipes/quantity.pipe';
import { OperationType } from '../../domain/entities/dashboard';
import { AttentionList, RecentActivity } from './activity-widgets';
import { KpiCard } from './kpi-card';
import { BatchWatch } from './stock-widgets';
import { WidgetCard } from './widget-card';
import { CompanyDashboardStore } from '../state/company-dashboard.store';

/**
 * Storekeeper dashboard: what to do now. No financial figure: the backend
 * does not compute stock values for this role.
 */
@Component({
  selector: 'app-operations-dashboard',
  imports: [
    TranslatePipe,
    QuantityPipe,
    KpiCard,
    WidgetCard,
    AttentionList,
    RecentActivity,
    BatchWatch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = store.summary.data();
    <h2 class="sr-only">{{ 'dashboard.sections.kpis' | translate }}</h2>
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      <app-kpi-card
        icon="pi-history"
        tone="primary"
        testId="kpi-operations-today"
        [label]="'dashboard.kpi.operationsToday' | translate"
        [value]="s ? (operationsToday() | quantity) : null"
        [hint]="
          s
            ? ('dashboard.kpi.operationsTodayHint'
              | translate: { entries: s.activity.today.entries, exits: s.activity.today.exits })
            : ''
        "
        [link]="routes.STOCK.MOVEMENTS"
      />
    </div>
    @if (store.summary.error() && !s) {
      <app-widget-card
        class="mt-4"
        [title]="'dashboard.sections.kpis' | translate"
        [error]="store.summary.error()"
        (retry)="store.reloadSummary()"
      />
    }

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
        (retry)="store.loadRecent()"
      >
        <div
          actions
          role="group"
          [attr.aria-label]="'dashboard.activity.filter' | translate"
          class="flex flex-wrap gap-1"
        >
          @for (tab of tabs; track tab.key) {
            <button
              type="button"
              [attr.aria-pressed]="store.activityType() === tab.type"
              class="min-h-9 rounded-md px-2.5 text-xs font-medium"
              [class]="
                store.activityType() === tab.type
                  ? 'bg-primary text-primary-fg'
                  : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
              "
              (click)="store.showActivity(tab.type)"
            >
              {{ 'dashboard.activity.tabs.' + tab.key | translate }}
            </button>
          }
        </div>
        @if (store.recent.data(); as recent) {
          <app-recent-activity [operations]="recent" />
        }
      </app-widget-card>
    </div>

    <div class="mt-4">
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
    </div>
  `,
})
export class OperationsDashboard {
  protected readonly store = inject(CompanyDashboardStore);
  protected readonly language = inject(LanguageStore);
  protected readonly routes = APP_ROUTES;
  protected readonly tabs: readonly { key: string; type: OperationType | null }[] = [
    { key: 'all', type: null },
    { key: 'entries', type: 'ENTRY' },
    { key: 'exits', type: 'EXIT' },
    { key: 'transfers', type: 'TRANSFER' },
  ];

  protected readonly operationsToday = computed(() => {
    const today = this.store.summary.data()?.activity.today;
    return today ? today.entries + today.exits + today.transfers + today.adjustments : 0;
  });
  protected readonly attentionEmpty = computed(() => {
    const a = this.store.summary.data()?.attention;
    return !!a && a.outOfStock.length + a.lowStock.length + a.expiredBatches.length === 0;
  });
}
