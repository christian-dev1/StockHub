import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BadgeTone, StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { LocationType } from '../../domain/entities/location';

const TONES: Record<LocationType, BadgeTone> = {
  STORE: 'primary',
  WAREHOUSE: 'info',
  DEPOT: 'warning',
};

@Component({
  selector: 'app-location-type-badge',
  imports: [StatusBadge, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-status-badge
    [label]="'locations.types.' + type() | translate"
    [tone]="tones[type()]"
  />`,
})
export class LocationTypeBadge {
  readonly type = input.required<LocationType>();
  protected readonly tones = TONES;
}
