import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../core/config/routes/app.routes';
import { DateTimePipe } from '../../../../shared/pipes/date-time.pipe';
import { QuantityPipe } from '../../../../shared/pipes/quantity.pipe';
import {
  DashboardSummary,
  MovedProduct,
  OperationType,
  RecentOperation,
} from '../../domain/entities/dashboard';

const TYPE_STYLE: Record<OperationType, { icon: string; tone: string }> = {
  ENTRY: { icon: 'pi-arrow-down-left', tone: 'bg-success/10 text-success' },
  EXIT: { icon: 'pi-arrow-up-right', tone: 'bg-danger/10 text-danger' },
  TRANSFER: { icon: 'pi-arrow-right-arrow-left', tone: 'bg-info/10 text-info' },
  ADJUSTMENT: { icon: 'pi-sliders-h', tone: 'bg-warning/10 text-warning' },
};

/** Timeline of the latest stock operations; each leads to its stock note. */
@Component({
  selector: 'app-recent-activity',
  imports: [RouterLink, TranslatePipe, DateTimePipe, QuantityPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="divide-y divide-border overflow-hidden" data-testid="recent-activity">
      @for (op of operations(); track op.documentId) {
        <li>
          <a
            [routerLink]="routes.STOCK.DOCUMENT(op.documentId)"
            class="flex min-w-0 flex-wrap items-start gap-3 py-3 text-fg no-underline hover:bg-surface-muted/50"
          >
            <span
              class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
              [class]="styles[op.type].tone"
              aria-hidden="true"
            >
              <i [class]="'pi text-xs ' + styles[op.type].icon"></i>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm">
                <span class="font-medium">{{
                  'dashboard.activity.types.' + op.type | translate
                }}</span>
                <span class="font-semibold tabular-nums">
                  {{
                    op.type === 'TRANSFER'
                      ? (op.quantity | quantity)
                      : (op.quantity | quantity: true)
                  }}
                </span>
                · {{ op.productName ?? '—' }}
                @if (op.otherProducts > 0) {
                  <span class="text-fg-muted">
                    {{ 'dashboard.activity.others' | translate: { count: op.otherProducts } }}</span
                  >
                }
              </span>
              <span class="block truncate text-xs text-fg-muted">
                {{ op.location.name }}
                @if (op.destination) {
                  → {{ op.destination.name }}
                }
                · {{ 'dashboard.activity.by' | translate: { name: op.performedByName } }}
              </span>
            </span>
            <span class="shrink-0 text-right text-xs text-fg-muted max-sm:ml-11 max-sm:w-full max-sm:text-left">
              <span class="block">{{ op.createdAt | dateTime: 'short' }}</span>
              <span class="block font-mono">{{ op.number }}</span>
            </span>
          </a>
        </li>
      }
    </ol>
  `,
})
export class RecentActivity {
  readonly operations = input.required<readonly RecentOperation[]>();
  protected readonly routes = APP_ROUTES;
  protected readonly styles = TYPE_STYLE;
}

/** Products involved in the most stock operations (not sales: there are none yet). */
@Component({
  selector: 'app-top-products',
  imports: [RouterLink, TranslatePipe, QuantityPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="space-y-3">
      @for (product of rows(); track product.productId; let i = $index) {
        <li class="text-sm">
          <a
            [routerLink]="routes.STOCK.MOVEMENTS"
            [queryParams]="{ productId: product.productId }"
            class="block text-fg no-underline hover:text-primary"
          >
            <span class="mb-1 flex items-baseline justify-between gap-3">
              <span class="min-w-0 truncate">
                <span class="mr-1 text-fg-muted tabular-nums">{{ i + 1 }}.</span>{{ product.name }}
              </span>
              <span class="shrink-0 text-xs text-fg-muted">
                {{ 'dashboard.top.operations' | translate: { count: product.operations } }}
              </span>
            </span>
            <span class="block h-2 rounded-full bg-surface-muted" aria-hidden="true">
              <span
                class="block h-full rounded-full bg-series-1"
                [style.width.%]="product.share"
              ></span>
            </span>
            <span class="mt-1 block text-xs text-fg-muted">
              {{ 'dashboard.top.in' | translate }} {{ product.enteredQuantity | quantity }} ·
              {{ 'dashboard.top.out' | translate }} {{ product.exitedQuantity | quantity }}
            </span>
          </a>
        </li>
      }
    </ol>
  `,
})
export class TopProducts {
  readonly products = input.required<readonly MovedProduct[]>();
  protected readonly routes = APP_ROUTES;
  protected readonly rows = computed(() => {
    const max = Math.max(1, ...this.products().map((p) => p.operations));
    return this.products().map((p) => ({ ...p, share: (p.operations / max) * 100 }));
  });
}

/**
 * "To handle": out-of-stock and low levels, expired and expiring batches, with
 * the quick actions the user's permissions allow.
 */
@Component({
  selector: 'app-attention-list',
  imports: [RouterLink, TranslatePipe, QuantityPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="divide-y divide-border" data-testid="attention-list">
      @for (item of items(); track item.key) {
        <li class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
          <i [class]="'pi ' + item.icon + ' ' + item.tone" aria-hidden="true"></i>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-fg">{{ item.title }}</p>
            <p class="truncate text-xs text-fg-muted">{{ item.detail }}</p>
          </div>
          <span class="text-sm font-semibold tabular-nums text-fg">{{
            item.quantity | quantity
          }}</span>
          @if (item.action; as action) {
            <a
              [routerLink]="action.route"
              [queryParams]="action.query"
              class="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-fg no-underline hover:bg-surface-muted"
            >
              <i [class]="'pi text-[0.7rem] ' + action.icon" aria-hidden="true"></i>
              {{ action.label | translate }}
            </a>
          }
        </li>
      }
    </ul>
  `,
})
export class AttentionList {
  readonly attention = input.required<DashboardSummary['attention']>();
  private readonly auth = inject(AuthStore);

  protected readonly items = computed(() => {
    const a = this.attention();
    const canEnter = this.auth.can('STOCK_ENTRY');
    const entry = (productId: string, locationId: string) =>
      canEnter
        ? {
            route: APP_ROUTES.STOCK.ENTRY,
            query: { productId, locationId },
            icon: 'pi-arrow-down-left',
            label: 'dashboard.attention.enter',
          }
        : null;
    const batches = {
      route: APP_ROUTES.STOCK.BATCHES,
      query: null,
      icon: 'pi-calendar-clock',
      label: 'dashboard.attention.seeBatches',
    };
    return [
      ...a.outOfStock.map((l) => ({
        key: `out-${l.productId}-${l.locationId}`,
        icon: 'pi-ban',
        tone: 'text-danger',
        title: l.productName,
        detail: `${l.locationName} · ${l.sku}`,
        quantity: l.quantity,
        action: entry(l.productId, l.locationId),
      })),
      ...a.lowStock.map((l) => ({
        key: `low-${l.productId}-${l.locationId}`,
        icon: 'pi-exclamation-triangle',
        tone: 'text-warning',
        title: l.productName,
        detail: `${l.locationName} · ${l.sku}`,
        quantity: l.quantity,
        action: entry(l.productId, l.locationId),
      })),
      ...a.expiredBatches.map((b) => ({
        key: `expired-${b.batchId}`,
        icon: 'pi-times-circle',
        tone: 'text-danger',
        title: b.productName,
        detail: `${b.batchNumber} · ${b.locationName}`,
        quantity: b.quantity,
        action: this.auth.can('BATCH_MANAGE') ? batches : null,
      })),
    ];
  });
}
