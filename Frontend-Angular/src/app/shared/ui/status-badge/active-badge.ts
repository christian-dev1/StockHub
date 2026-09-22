import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusBadge } from './status-badge';

/** "Active" / "Inactive" pill shared by catalogue entities. */
@Component({
  selector: 'app-active-badge',
  imports: [StatusBadge, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-status-badge
    [label]="(active() ? 'common.status.active' : 'common.status.inactive') | translate"
    [tone]="active() ? 'success' : 'neutral'"
  />`,
})
export class ActiveBadge {
  readonly active = input.required<boolean>();
}
