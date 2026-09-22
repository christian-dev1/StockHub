import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { toAppError } from '../../../../shared/utils/resource-state';
import { Location } from '../../domain/entities/location';
import {
  ChangeLocationStatusUseCase,
  ListLocationsUseCase,
} from '../../domain/use-cases/location.use-cases';

/** Locations of the company and the status actions, keeping the list in sync. */
@Injectable()
export class LocationsStore {
  private readonly listLocations = inject(ListLocationsUseCase);
  private readonly status = inject(ChangeLocationStatusUseCase);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _locations = signal<Location[]>([]);
  readonly locations = this._locations.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);
  readonly loaded = signal(false);
  /** A single location means a single-site company: the UI stays minimal. */
  readonly singleSite = computed(() => this._locations().length <= 1);

  private includeInactive = false;

  load(includeInactive: boolean): void {
    this.includeInactive = includeInactive;
    this.loading.set(true);
    this.error.set(null);
    this.listLocations
      .execute(includeInactive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (locations) => {
          this._locations.set(locations);
          this.loading.set(false);
          this.loaded.set(true);
        },
        error: (error: unknown) => {
          this.error.set(toAppError(error));
          this.loading.set(false);
        },
      });
  }

  activate(id: string): Observable<Location> {
    return this.status.activate(id).pipe(tap((location) => this.replace(location)));
  }

  deactivate(id: string): Observable<Location> {
    return this.status.deactivate(id).pipe(tap((location) => this.replace(location)));
  }

  /** The former primary changes too, so the whole list is reloaded. */
  setPrimary(id: string): Observable<Location> {
    return this.status.setPrimary(id).pipe(tap(() => this.load(this.includeInactive)));
  }

  private replace(location: Location): void {
    this._locations.update((list) => list.map((l) => (l.id === location.id ? location : l)));
  }
}
