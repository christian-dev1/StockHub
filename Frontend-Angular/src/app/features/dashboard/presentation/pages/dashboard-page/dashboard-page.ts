import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { DisplayTimeZone } from '../../../../../core/i18n/time-zone';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { zonedToday } from '../../../../../shared/utils/zoned-day';
import { dashboardVariant } from '../../../domain/entities/dashboard';
import { BusinessDashboard } from '../../components/business-dashboard';
import { DashboardFiltersBar } from '../../components/dashboard-filters';
import { OperationsDashboard } from '../../components/operations-dashboard';
import { PlatformDashboardView } from '../../components/platform-dashboard';
import { QuickActions } from '../../components/quick-actions';
import { CompanyDashboardStore } from '../../state/company-dashboard.store';

/**
 * Entry page: the layout follows the role and permissions (platform, business
 * or operations); the figures come from the backend, which restricts them to
 * the user's company, locations and rights.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [
    TranslatePipe,
    PageHeader,
    DashboardFiltersBar,
    QuickActions,
    BusinessDashboard,
    OperationsDashboard,
    PlatformDashboardView,
  ],
  providers: [CompanyDashboardStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      [title]="'dashboard.greeting' | translate: { name: firstName() }"
      [subtitle]="'dashboard.subtitles.' + variant() | translate"
    />
    @switch (variant()) {
      @case ('platform') {
        <app-platform-dashboard />
      }
      @default {
        <div class="mb-5">
          <app-dashboard-filters
            [filters]="store.filters()"
            [locations]="store.summary.data()?.scope?.locations ?? []"
            [today]="today()"
            (filtersChange)="store.applyFilters($event)"
          />
        </div>
        <div class="mb-6">
          <app-quick-actions
            [multiSite]="auth.hasMultipleLocations()"
            [exclude]="variant() === 'business' ? ['labels', 'stock'] : ['product']"
          />
        </div>
        @if (variant() === 'business') {
          <app-business-dashboard />
        } @else {
          <app-operations-dashboard />
        }
      }
    }
  `,
})
export class DashboardPage implements OnInit {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(CompanyDashboardStore);
  private readonly timeZone = inject(DisplayTimeZone);

  protected readonly variant = computed(() =>
    dashboardVariant(this.auth.session()?.role, (p) => this.auth.can(p)),
  );
  protected readonly firstName = computed(() => this.auth.session()?.firstName ?? '');
  protected readonly today = computed(() => zonedToday(this.timeZone.zone()));

  ngOnInit(): void {
    if (this.variant() !== 'platform') {
      this.store.load(this.variant() === 'business');
    }
  }
}
