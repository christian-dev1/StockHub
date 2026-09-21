import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RoleCode } from '../../../../core/config/permissions/permissions';
import { BadgeTone, StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { UserStatus } from '../../domain/entities/user';

const ROLE_TONES: Record<RoleCode, BadgeTone> = {
  SUPER_ADMIN: 'danger',
  ADMIN: 'primary',
  MANAGER: 'info',
  MAGASINIER: 'warning',
  VENDEUR: 'neutral',
};

@Component({
  selector: 'app-role-badge',
  imports: [StatusBadge, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-status-badge [label]="'roles.' + role() | translate" [tone]="tones[role()]" />`,
})
export class RoleBadge {
  readonly role = input.required<RoleCode>();
  protected readonly tones = ROLE_TONES;
}

@Component({
  selector: 'app-user-status-badge',
  imports: [StatusBadge, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-status-badge
    [label]="'users.status.' + status() | translate"
    [tone]="status() === 'ACTIVE' ? 'success' : 'danger'"
  />`,
})
export class UserStatusBadge {
  readonly status = input.required<UserStatus>();
}
