import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BadgeTone, StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import {
  Batch,
  DocumentType,
  ExpiryStatus,
  LevelState,
  MovementType,
  increases,
} from '../../domain/entities/stock';

export const DOCUMENT_TONES: Record<DocumentType, BadgeTone> = {
  ENTRY: 'success',
  EXIT: 'danger',
  ADJUSTMENT: 'warning',
  TRANSFER: 'info',
};

const LEVEL_TONES: Record<LevelState, BadgeTone> = {
  IN_STOCK: 'success',
  LOW: 'warning',
  OUT: 'danger',
  NEGATIVE: 'danger',
};

/** "In stock" / "Low stock" / "Out of stock" / "Negative stock". */
@Component({
  selector: 'app-level-state-badge',
  imports: [StatusBadge, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-status-badge
    [label]="'stock.states.' + state() | translate"
    [tone]="tones[state()]"
  />`,
})
export class LevelStateBadge {
  readonly state = input.required<LevelState>();
  protected readonly tones = LEVEL_TONES;
}

const EXPIRY_TONES: Record<ExpiryStatus, BadgeTone> = {
  VALID: 'success',
  EXPIRING_SOON: 'warning',
  EXPIRED: 'danger',
};

/**
 * Expiry status of a batch. A batch without expiry date says nothing (no
 * useless "valid" badge); an empty batch is shown as depleted.
 */
@Component({
  selector: 'app-expiry-badge',
  imports: [StatusBadge, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (batch().status === 'DEPLETED') {
      <app-status-badge [label]="'stock.batchStatus.DEPLETED' | translate" tone="neutral" />
    } @else if (batch().expirationDate) {
      <app-status-badge
        [label]="'stock.expiry.' + batch().expiryStatus | translate"
        [tone]="tones[batch().expiryStatus]"
      />
    } @else {
      <span class="text-fg-muted">—</span>
    }
  `,
})
export class ExpiryBadge {
  readonly batch = input.required<Pick<Batch, 'status' | 'expiryStatus' | 'expirationDate'>>();
  protected readonly tones = EXPIRY_TONES;
}

/** Movement type with an arrow telling whether it added or removed stock. */
@Component({
  selector: 'app-movement-type-badge',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
      [class]="
        up()
          ? 'bg-success/10 text-success ring-success/30'
          : 'bg-danger/10 text-danger ring-danger/30'
      "
    >
      <i
        [class]="'pi text-[0.65rem] ' + (up() ? 'pi-arrow-down-left' : 'pi-arrow-up-right')"
        aria-hidden="true"
      ></i>
      {{ 'stock.movementTypes.' + type() | translate }}
    </span>
  `,
})
export class MovementTypeBadge {
  readonly type = input.required<MovementType>();
  protected readonly up = computed(() => increases(this.type()));
}
