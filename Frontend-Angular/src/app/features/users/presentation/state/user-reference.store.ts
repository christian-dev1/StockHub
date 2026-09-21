import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { LocationOption, Role } from '../../domain/entities/user';
import { GetUserReferenceDataUseCase } from '../../domain/use-cases/user.use-cases';

/** Roles the current admin may grant and the company's locations. */
@Injectable()
export class UserReferenceStore {
  private readonly reference = inject(GetUserReferenceDataUseCase);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles = signal<readonly Role[]>([]);
  readonly locations = signal<readonly LocationOption[]>([]);
  readonly loaded = signal(false);
  readonly locationNames = computed(() => new Map(this.locations().map((l) => [l.id, l.name])));

  roleLabels(): Record<string, string> {
    return Object.fromEntries(
      ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MAGASINIER', 'VENDEUR'].map((code) => [
        code,
        this.translate.instant(`roles.${code}`) as string,
      ]),
    );
  }

  load(): void {
    forkJoin({ roles: this.reference.assignableRoles(), locations: this.reference.locations() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ roles, locations }) => {
          this.roles.set(roles);
          this.locations.set(locations);
          this.loaded.set(true);
        },
        error: () => this.loaded.set(true),
      });
  }
}
