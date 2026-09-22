import { Injectable, computed, inject } from '@angular/core';
import { AuthStore } from '../../../../core/auth/auth-store';
import {
  OPERATION_PERMISSIONS,
  STOCK_OPERATIONS,
  StockLocation,
  StockOperation,
} from '../../domain/entities/stock';

/**
 * What the current user may do with stock, and where. Locations come from the
 * session (active locations the user is assigned to): with a single one, the
 * screens select it silently and hide everything related to other sites.
 * Permissions only adapt the UI; the backend re-checks every operation.
 */
@Injectable()
export class StockContext {
  private readonly auth = inject(AuthStore);

  readonly locations = computed<StockLocation[]>(() =>
    [...this.auth.locations()]
      .map((l) => ({ id: l.id, code: l.code, name: l.name, primary: l.primary }))
      .sort((a, b) => Number(b.primary) - Number(a.primary) || a.name.localeCompare(b.name)),
  );
  readonly multiLocation = computed(() => this.locations().length > 1);
  readonly hasLocation = computed(() => this.locations().length > 0);
  /** Location preselected in forms: the primary one, else the only/first one. */
  readonly defaultLocationId = computed(() => this.locations()[0]?.id ?? null);

  readonly allowNegativeStock = computed(() => this.auth.company()?.allowNegativeStock ?? false);
  readonly expiryWarningDays = computed(() => this.auth.company()?.expiryWarningDays ?? 0);
  readonly canSeeBatches = computed(() => this.auth.can('BATCH_MANAGE'));
  readonly canSeeUsers = computed(() => this.auth.can('USER_VIEW'));

  /** Operations offered to this user; a transfer needs two locations. */
  readonly operations = computed<StockOperation[]>(() =>
    STOCK_OPERATIONS.filter(
      (operation) =>
        this.auth.can(OPERATION_PERMISSIONS[operation]) &&
        (operation !== 'transfer' || this.multiLocation()),
    ),
  );

  can(operation: StockOperation): boolean {
    return this.operations().includes(operation);
  }

  locationOptions() {
    return this.locations().map((l) => ({ value: l.id, label: l.name }));
  }
}
