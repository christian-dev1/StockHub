import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { map, of, startWith, switchMap } from 'rxjs';
import { LanguageStore } from '../../../core/i18n/language-store';
import { ErrorMessages } from '../../utils/error-message';
import { ServerFieldError } from '../../utils/server-errors';

let nextId = 0;

/**
 * Accessible field wrapper: label, hint and validation message. The projected
 * control must use `[id]="forId"` and `[attr.aria-describedby]` of this field.
 * PrimeNG selects render a combobox that a `<label for>` cannot name: give them
 * `[ariaLabelledBy]="forId + '-label'"`.
 * The host may shrink below its content (min-w-0) so that wide controls such as
 * p-inputnumber never push a grid or flex parent wider than the screen.
 * Validation keys are translated from `validation.<errorName>`; server-side
 * errors (set by applyServerErrors) are translated by their backend code.
 */
@Component({
  selector: 'app-form-field',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div class="flex min-w-0 flex-col gap-1.5">
      <label [id]="forId() + '-label'" [attr.for]="forId()" class="text-sm font-medium text-fg">
        {{ label() }}
        @if (required()) {
          <span class="text-danger" aria-hidden="true">*</span>
        }
      </label>
      <ng-content />
      @if (error(); as e) {
        <p class="text-xs text-danger" [id]="forId() + '-message'" role="alert">
          {{ e.server ?? (e.key | translate: e.params) }}
        </p>
      } @else if (hint()) {
        <p class="text-xs text-fg-muted" [id]="forId() + '-message'">{{ hint() }}</p>
      }
    </div>
  `,
})
export class FormField {
  readonly label = input.required<string>();
  readonly forId = input<string>(`field-${nextId++}`);
  readonly control = input<AbstractControl | null>(null);
  readonly hint = input<string>();
  readonly required = input(false);

  private readonly errors = inject(ErrorMessages);
  private readonly language = inject(LanguageStore);

  /** Re-evaluates whenever the control's value, status or touched state changes. */
  private readonly controlEvents = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) => (control ? control.events.pipe(startWith(null)) : of(null))),
      map(() => ({})),
    ),
    { initialValue: {} },
  );

  protected readonly error = computed(() => {
    this.controlEvents();
    this.language.language();
    const control = this.control();
    if (!control?.errors || !(control.touched || control.dirty)) {
      return null;
    }
    const [name] = Object.keys(control.errors);
    const detail: unknown = control.errors[name];
    return {
      key: `validation.${name}`,
      params:
        typeof detail === 'object' && detail !== null ? (detail as Record<string, unknown>) : {},
      server: name === 'server' ? this.serverMessage(detail) : null,
    };
  });

  private serverMessage(detail: unknown): string {
    if (typeof detail === 'object' && detail !== null && 'code' in detail) {
      const error = detail as ServerFieldError;
      return this.errors.ofField(error.code, error.message);
    }
    return String(detail);
  }
}
