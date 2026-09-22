import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_ROUTES } from '../../../../core/config/routes/app.routes';
import { StockOperation } from '../../domain/entities/stock';
import { StockContext } from '../state/stock-context';

export const OPERATION_ROUTES: Record<StockOperation, string> = {
  entry: APP_ROUTES.STOCK.ENTRY,
  exit: APP_ROUTES.STOCK.EXIT,
  adjustment: APP_ROUTES.STOCK.ADJUSTMENT,
  transfer: APP_ROUTES.STOCK.TRANSFER,
};

export const OPERATION_ICONS: Record<StockOperation, string> = {
  entry: 'pi-arrow-down-left',
  exit: 'pi-arrow-up-right',
  adjustment: 'pi-sliders-h',
  transfer: 'pi-arrow-right-arrow-left',
};

/**
 * The stock operations the user may run, as buttons (stock page header) or
 * as tabs between operation screens. Only permitted operations are shown;
 * transfers need at least two locations.
 */
@Component({
  selector: 'app-operation-links',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (current(); as active) {
      <nav [attr.aria-label]="'stock.operations.label' | translate" class="mb-4 overflow-x-auto">
        <ul class="flex min-w-max gap-1 rounded-xl border border-border bg-surface p-1">
          @for (operation of context.operations(); track operation) {
            <li>
              <a
                [routerLink]="routes[operation]"
                [queryParams]="queryParams()"
                [attr.aria-current]="operation === active ? 'page' : null"
                class="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium"
                [class]="
                  operation === active
                    ? 'bg-primary text-primary-fg'
                    : 'text-fg hover:bg-surface-muted'
                "
              >
                <i [class]="'pi ' + icons[operation]" aria-hidden="true"></i>
                {{ 'stock.operations.' + operation | translate }}
              </a>
            </li>
          }
        </ul>
      </nav>
    } @else {
      <div class="flex flex-wrap gap-2">
        @for (operation of context.operations(); track operation; let first = $first) {
          <a
            [routerLink]="routes[operation]"
            class="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium no-underline"
            [class]="
              first
                ? 'bg-primary text-primary-fg hover:opacity-90'
                : 'border border-border bg-surface text-fg hover:bg-surface-muted'
            "
          >
            <i [class]="'pi ' + icons[operation]" aria-hidden="true"></i>
            {{ 'stock.operations.' + operation | translate }}
          </a>
        }
      </div>
    }
  `,
})
export class OperationLinks {
  /** Operation of the current screen: renders tabs. Without it, renders buttons. */
  readonly current = input<StockOperation | null>(null);
  readonly queryParams = input<Record<string, string> | null>(null);

  protected readonly context = inject(StockContext);
  protected readonly routes = OPERATION_ROUTES;
  protected readonly icons = OPERATION_ICONS;
}
