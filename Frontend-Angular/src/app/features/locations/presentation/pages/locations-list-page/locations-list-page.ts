import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { Observable } from 'rxjs';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { Confirmation } from '../../../../../shared/ui/confirm/confirmation';
import { EmptyState } from '../../../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { ActiveBadge } from '../../../../../shared/ui/status-badge/active-badge';
import { StatusBadge } from '../../../../../shared/ui/status-badge/status-badge';
import { Location, formatAddress } from '../../../domain/entities/location';
import { LocationTypeBadge } from '../../components/location-type-badge';
import { LocationsStore } from '../../state/locations.store';

@Component({
  selector: 'app-locations-list-page',
  imports: [
    RouterLink,
    TranslatePipe,
    ButtonModule,
    SkeletonModule,
    EmptyState,
    ErrorState,
    PageHeader,
    ActiveBadge,
    StatusBadge,
    LocationTypeBadge,
  ],
  providers: [LocationsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './locations-list-page.html',
})
export class LocationsListPage implements OnInit {
  protected readonly store = inject(LocationsStore);
  protected readonly auth = inject(AuthStore);
  private readonly confirmation = inject(Confirmation);
  private readonly notifier = inject(Notifier);

  protected readonly routes = APP_ROUTES;
  protected readonly address = formatAddress;
  protected readonly canCreate = computed(() => this.auth.can('WAREHOUSE_CREATE'));
  protected readonly canUpdate = computed(() => this.auth.can('WAREHOUSE_UPDATE'));
  /** Id of the location whose action is running (disables its buttons). */
  protected readonly busyId = signal<string | null>(null);
  protected readonly skeletons = [0, 1, 2];

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.store.load(this.canUpdate());
  }

  protected async setPrimary(location: Location): Promise<void> {
    const confirmed = await this.confirmation.ask({
      titleKey: 'locations.actions.setPrimary',
      messageKey: 'locations.confirm.setPrimary',
      params: { name: location.name },
    });
    if (confirmed)
      this.run(location, this.store.setPrimary(location.id), 'locations.saved.primary');
  }

  protected async toggle(location: Location): Promise<void> {
    const disabling = location.active;
    const confirmed = await this.confirmation.ask({
      titleKey: disabling ? 'locations.actions.deactivate' : 'locations.actions.activate',
      messageKey: disabling ? 'locations.confirm.deactivate' : 'locations.confirm.activate',
      params: { name: location.name },
      destructive: disabling,
    });
    if (!confirmed) return;
    const request = disabling
      ? this.store.deactivate(location.id)
      : this.store.activate(location.id);
    this.run(location, request, 'common.saved');
  }

  private run(location: Location, request: Observable<Location>, messageKey: string): void {
    this.busyId.set(location.id);
    request.subscribe({
      next: () => {
        this.busyId.set(null);
        this.notifier.success(messageKey, { name: location.name });
      },
      error: (error: AppError) => {
        this.busyId.set(null);
        this.notifier.error(error);
      },
    });
  }
}
