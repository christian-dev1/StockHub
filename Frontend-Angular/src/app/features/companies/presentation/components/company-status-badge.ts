import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { CompanyStatus } from '../../domain/entities/company';

@Component({
  selector: 'app-company-status-badge',
  imports: [StatusBadge, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-status-badge
    [label]="'companies.status.' + status() | translate"
    [tone]="status() === 'ACTIVE' ? 'success' : 'danger'"
  />`,
})
export class CompanyStatusBadge {
  readonly status = input.required<CompanyStatus>();
}
