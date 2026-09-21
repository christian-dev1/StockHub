import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SystemStatusCard } from '../../components/system-status-card/system-status-card';
import { DashboardStore } from '../../state/dashboard.store';

@Component({
  selector: 'app-dashboard-page',
  imports: [TranslatePipe, PageHeader, SystemStatusCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      [title]="'dashboard.title' | translate"
      [subtitle]="'dashboard.subtitle' | translate"
    />
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <app-system-status-card [state]="store.health()" (refresh)="store.loadHealth()" />
    </div>
  `,
})
export class DashboardPage implements OnInit {
  protected readonly store = inject(DashboardStore);

  ngOnInit(): void {
    this.store.loadHealth();
  }
}
