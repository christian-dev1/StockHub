import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { map, of, startWith, switchMap } from 'rxjs';

let nextId = 0;

/**
 * Accessible field wrapper: label, hint and validation message. The projected
 * control must use `[id]="forId"` and `[attr.aria-describedby]` of this field.
 * Validation keys are translated from `validation.<errorName>`; server-side
 * errors (set by applyServerErrors) are shown as provided.
 */
@Component({
  selector: 'app-form-field',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1.5">
      <label [attr.for]="forId()" class="text-sm font-medium text-fg">
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
      server: name === 'server' ? String(detail) : null,
    };
  });
}
