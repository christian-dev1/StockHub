import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

/**
 * One secondary action inside a row menu: label, icon, optional danger style.
 * The menu is a pure view; the page owns the behaviour through `run`.
 */
export interface RowAction {
  readonly key: string;
  readonly icon: string;
  readonly labelKey: string;
  readonly run: () => void;
  /** Disabled actions stay visible but cannot be triggered. */
  readonly disabled?: boolean;
  /** Danger tint, reserved for destructive actions. */
  readonly danger?: boolean;
  /** Optional tooltip explaining why the action is disabled. */
  readonly titleKey?: string | null;
}

/**
 * Shared "..." row menu: one ghost icon button per row instead of a stack of
 * buttons. Actions are plain descriptors; the page keeps the behaviour by
 * binding `run` closures itself and re-emitting the chosen action.
 */
@Component({
  selector: 'app-row-actions',
  imports: [MenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-menu #menu [model]="items()" [popup]="true" appendTo="body" />
    <button
      type="button"
      class="inline-flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-surface-muted hover:text-fg"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-haspopup]="'menu'"
      (click)="menu.toggle($event)"
    >
      <i class="pi pi-ellipsis-h" aria-hidden="true"></i>
    </button>
  `,
})
export class RowActions {
  /** Actions of the row; order is preserved. */
  readonly actions = input.required<readonly RowAction[]>();
  /** Accessible name of the trigger, e.g. "Actions — Category X". */
  readonly ariaLabel = input.required<string>();
  /** Emits the action chosen by the user so the page runs it. */
  readonly actionRun = output<RowAction>();

  private readonly translate = inject(TranslateService);

  protected readonly items = computed<MenuItem[]>(() =>
    this.actions().map((action) => ({
      label: this.translate.instant(action.labelKey) as string,
      icon: action.icon,
      styleClass: action.danger ? 'text-danger' : undefined,
      disabled: action.disabled === true,
      title: action.titleKey ? (this.translate.instant(action.titleKey) as string) : undefined,
      command: () => this.actionRun.emit(action),
    })),
  );
}
