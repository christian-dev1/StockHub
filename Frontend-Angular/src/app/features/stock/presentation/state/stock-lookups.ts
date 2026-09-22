import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../../../../core/auth/auth-store';
import { Batch, StockLocation, StockProduct } from '../../domain/entities/stock';
import {
  SearchBatchesUseCase,
  StockReferencesUseCase,
} from '../../domain/use-cases/stock.use-cases';

/**
 * Names shown instead of ids in movements, batches and stock notes. The
 * backend returns ids only, so each unknown product or batch is fetched once
 * and cached for the whole stock area. Failures leave the id unresolved: the
 * screens then show a neutral placeholder.
 */
@Injectable()
export class StockLookups {
  private readonly references = inject(StockReferencesUseCase);
  private readonly batchQueries = inject(SearchBatchesUseCase);
  private readonly auth = inject(AuthStore);

  private readonly products = signal<ReadonlyMap<string, StockProduct>>(new Map());
  private readonly batches = signal<ReadonlyMap<string, Batch>>(new Map());
  private readonly otherLocations = signal<ReadonlyMap<string, StockLocation>>(new Map());
  private readonly users = signal<ReadonlyMap<string, string>>(new Map());
  private readonly requested = new Set<string>();

  private readonly sessionLocations = computed(
    () => new Map(this.auth.locations().map((l) => [l.id, l.name])),
  );
  /** Users that can be chosen in the "performed by" filter. */
  readonly userOptions = computed(() => {
    const session = this.auth.session();
    const options = [...this.users()].map(([value, label]) => ({ value, label }));
    if (session && !this.users().has(session.id)) {
      options.unshift({ value: session.id, label: this.auth.displayName() });
    }
    return options;
  });

  product(id: string): StockProduct | null {
    return this.products().get(id) ?? null;
  }

  batch(id: string | null): Batch | null {
    return id ? (this.batches().get(id) ?? null) : null;
  }

  locationName(id: string | null): string | null {
    if (!id) return null;
    return this.sessionLocations().get(id) ?? this.otherLocations().get(id)?.name ?? null;
  }

  userName(id: string): string | null {
    const session = this.auth.session();
    if (session?.id === id) return this.auth.displayName();
    return this.users().get(id) ?? null;
  }

  /** Keeps a product already loaded elsewhere (e.g. chosen in a picker). */
  remember(product: StockProduct): void {
    this.products.update((map) => new Map(map).set(product.id, product));
  }

  /** Fetches the products, batches, locations and users referenced by these rows. */
  resolve(
    rows: readonly {
      productId?: string;
      batchId?: string | null;
      locationId?: string;
      destinationLocationId?: string | null;
      performedBy?: string;
    }[],
  ): void {
    for (const row of rows) {
      if (row.productId) this.fetchProduct(row.productId);
      if (row.batchId) this.fetchBatch(row.batchId);
      for (const location of [row.locationId, row.destinationLocationId]) {
        if (location && !this.locationName(location)) this.fetchLocations();
      }
      if (row.performedBy && !this.userName(row.performedBy)) this.fetchUsers();
    }
  }

  /** Loads the users list once, for the filter of movements (USER_VIEW only). */
  loadUsers(): void {
    this.fetchUsers();
  }

  private fetchProduct(id: string): void {
    if (this.products().has(id) || !this.once(`product:${id}`)) return;
    this.references.product(id).subscribe({
      next: (product) => this.remember(product),
      error: () => undefined,
    });
  }

  private fetchBatch(id: string): void {
    if (this.batches().has(id) || !this.auth.can('BATCH_MANAGE') || !this.once(`batch:${id}`)) {
      return;
    }
    this.batchQueries.get(id).subscribe({
      next: (batch) => this.batches.update((map) => new Map(map).set(batch.id, batch)),
      error: () => undefined,
    });
  }

  private fetchLocations(): void {
    if (!this.auth.can('WAREHOUSE_VIEW') || !this.once('locations')) return;
    this.references.locations().subscribe({
      next: (locations) => this.otherLocations.set(new Map(locations.map((l) => [l.id, l]))),
      error: () => undefined,
    });
  }

  private fetchUsers(): void {
    if (!this.auth.can('USER_VIEW') || !this.once('users')) return;
    this.references.users().subscribe({
      next: (users) => this.users.set(new Map(users.map((u) => [u.id, u.name]))),
      error: () => undefined,
    });
  }

  /** True the first time a key is requested. */
  private once(key: string): boolean {
    if (this.requested.has(key)) return false;
    this.requested.add(key);
    return true;
  }
}
