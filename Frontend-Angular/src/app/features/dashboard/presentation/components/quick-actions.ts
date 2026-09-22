import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../../core/auth/auth-store';
import { Permission } from '../../../../core/config/permissions/permissions';
import { APP_ROUTES } from '../../../../core/config/routes/app.routes';

interface QuickAction {
  readonly key: string;
  readonly route: string;
  readonly icon: string;
  readonly permission: Permission;
  /** Transfers need two locations. */
  readonly multiSiteOnly?: boolean;
}

const ACTIONS: readonly QuickAction[] = [
  {
    key: 'entry',
    route: APP_ROUTES.STOCK.ENTRY,
    icon: 'pi-arrow-down-left',
    permission: 'STOCK_ENTRY',
  },
  {
    key: 'exit',
    route: APP_ROUTES.STOCK.EXIT,
    icon: 'pi-arrow-up-right',
    permission: 'STOCK_EXIT',
  },
  {
    key: 'transfer',
    route: APP_ROUTES.STOCK.TRANSFER,
    icon: 'pi-arrow-right-arrow-left',
    permission: 'STOCK_TRANSFER',
    multiSiteOnly: true,
  },
  {
    key: 'product',
    route: APP_ROUTES.PRODUCTS.CREATE,
    icon: 'pi-plus',
    permission: 'PRODUCT_CREATE',
  },
  {
    key: 'labels',
    route: APP_ROUTES.PRODUCTS.LABELS,
    icon: 'pi-barcode',
    permission: 'BARCODE_PRINT',
  },
  {
    key: 'batches',
    route: APP_ROUTES.STOCK.BATCHES,
    icon: 'pi-calendar-clock',
    permission: 'BATCH_MANAGE',
  },
  { key: 'stock', route: APP_ROUTES.STOCK.ROOT, icon: 'pi-warehouse', permission: 'STOCK_VIEW' },
];

/** Shortcuts to the operations the user's permissions allow, in a fixed order. */
@Component({
  selector: 'app-quick-actions',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="'dashboard.actions.title' | translate">
      <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3" [class.lg:grid-cols-6]="wide()">
        @for (action of actions(); track action.key; let first = $first) {
          <li>
            <a
              [routerLink]="action.route"
              class="flex min-h-12 items-center gap-2 rounded-lg border px-3 text-sm font-medium no-underline"
              [class]="
                first
                  ? 'border-primary bg-primary text-primary-fg hover:opacity-90'
                  : 'border-border bg-surface text-fg hover:bg-surface-muted'
              "
            >
              <i [class]="'pi ' + action.icon" aria-hidden="true"></i>
              <span class="truncate">{{ 'dashboard.actions.' + action.key | translate }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class QuickActions {
  readonly multiSite = input(false);
  /** Keys to leave out (e.g. the business view has no labels shortcut). */
  readonly exclude = input<readonly string[]>([]);
  readonly wide = input(true);
  private readonly auth = inject(AuthStore);

  protected readonly actions = computed(() =>
    ACTIONS.filter(
      (action) =>
        this.auth.can(action.permission) &&
        (!action.multiSiteOnly || this.multiSite()) &&
        !this.exclude().includes(action.key),
    ),
  );
}
