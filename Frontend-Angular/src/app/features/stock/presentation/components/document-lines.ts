import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CalendarDatePipe } from '../../../../shared/pipes/calendar-date.pipe';
import { QuantityPipe } from '../../../../shared/pipes/quantity.pipe';
import { StockMovement, increases, signedQuantity } from '../../domain/entities/stock';
import { StockLookups } from '../state/stock-lookups';
import { MovementTypeBadge } from './stock-badges';

/**
 * Lines of a stock note: product, batch, quantity and the level before/after
 * each line. Movements out of a location come first, so a transfer reads
 * "source, then destination". Table on wide screens, stacked cards on phones.
 */
@Component({
  selector: 'app-document-lines',
  imports: [TranslatePipe, QuantityPipe, CalendarDatePipe, MovementTypeBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hidden overflow-x-auto md:block">
      <table class="w-full text-left text-sm">
        <caption class="sr-only">
          {{
            caption()
          }}
        </caption>
        <thead
          class="border-b border-border bg-surface-muted/60 text-xs uppercase tracking-wide text-fg-muted"
        >
          <tr>
            <th scope="col" class="px-4 py-3 font-semibold">
              {{ 'stock.fields.product' | translate }}
            </th>
            @if (showLocation()) {
              <th scope="col" class="px-4 py-3 font-semibold">
                {{ 'stock.fields.location' | translate }}
              </th>
            }
            <th scope="col" class="px-4 py-3 font-semibold">
              {{ 'stock.fields.type' | translate }}
            </th>
            @if (hasBatches()) {
              <th scope="col" class="px-4 py-3 font-semibold">
                {{ 'stock.fields.batch' | translate }}
              </th>
            }
            <th scope="col" class="px-4 py-3 text-right font-semibold">
              {{ 'stock.fields.quantity' | translate }}
            </th>
            <th scope="col" class="px-4 py-3 text-right font-semibold">
              {{ 'stock.fields.before' | translate }}
            </th>
            <th scope="col" class="px-4 py-3 text-right font-semibold">
              {{ 'stock.fields.after' | translate }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          @for (line of sorted(); track line.id) {
            <tr>
              <td class="px-4 py-3">
                <span class="font-medium text-fg">{{ productName(line.productId) }}</span>
                @if (lookups.product(line.productId); as product) {
                  <span class="block font-mono text-xs text-fg-muted">{{ product.sku }}</span>
                }
              </td>
              @if (showLocation()) {
                <td class="px-4 py-3">{{ lookups.locationName(line.locationId) ?? '—' }}</td>
              }
              <td class="px-4 py-3"><app-movement-type-badge [type]="line.type" /></td>
              @if (hasBatches()) {
                <td class="px-4 py-3">
                  @if (line.batchId) {
                    <span class="font-mono text-xs">{{
                      lookups.batch(line.batchId)?.batchNumber ?? '…'
                    }}</span>
                    @if (lookups.batch(line.batchId)?.expirationDate; as expiry) {
                      <span class="block text-xs text-fg-muted">
                        {{ 'stock.fields.expiresOn' | translate: { date: expiry | calendarDate } }}
                      </span>
                    }
                  } @else {
                    —
                  }
                </td>
              }
              <td class="px-4 py-3 text-right font-semibold tabular-nums" [class]="tone(line)">
                {{ signed(line) | quantity: true }}
              </td>
              <td class="px-4 py-3 text-right tabular-nums text-fg-muted">
                {{ line.previousQuantity | quantity }}
              </td>
              <td class="px-4 py-3 text-right font-medium tabular-nums">
                {{ line.newQuantity | quantity }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <ul class="divide-y divide-border md:hidden" [attr.aria-label]="caption()">
      @for (line of sorted(); track line.id) {
        <li class="space-y-2 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium text-fg">{{ productName(line.productId) }}</p>
              @if (showLocation()) {
                <p class="text-xs text-fg-muted">
                  {{ lookups.locationName(line.locationId) ?? '—' }}
                </p>
              }
            </div>
            <span class="shrink-0 font-semibold tabular-nums" [class]="tone(line)">
              {{ signed(line) | quantity: true }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
            <app-movement-type-badge [type]="line.type" />
            @if (line.batchId) {
              <span>
                {{ 'stock.fields.batch' | translate }} :
                <span class="font-mono text-fg">{{
                  lookups.batch(line.batchId)?.batchNumber ?? '…'
                }}</span>
              </span>
            }
            <span>
              {{ 'stock.fields.before' | translate }} {{ line.previousQuantity | quantity }} →
              <span class="font-medium text-fg">{{ line.newQuantity | quantity }}</span>
            </span>
          </div>
        </li>
      }
    </ul>
  `,
})
export class DocumentLines {
  readonly lines = input.required<readonly StockMovement[]>();
  readonly caption = input.required<string>();
  readonly showLocation = input(false);

  protected readonly lookups = inject(StockLookups);
  protected readonly hasBatches = computed(() => this.lines().some((line) => !!line.batchId));
  protected readonly sorted = computed(() =>
    [...this.lines()].sort((a, b) => Number(increases(a.type)) - Number(increases(b.type))),
  );

  constructor() {
    effect(() => {
      const lines = this.lines();
      untracked(() => this.lookups.resolve(lines));
    });
  }

  protected productName(id: string): string {
    return this.lookups.product(id)?.name ?? '…';
  }

  protected signed(line: StockMovement): number {
    return signedQuantity(line);
  }

  protected tone(line: StockMovement): string {
    return increases(line.type) ? 'text-success' : 'text-danger';
  }
}
