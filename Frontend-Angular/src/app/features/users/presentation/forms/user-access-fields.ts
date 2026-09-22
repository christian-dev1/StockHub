import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { startWith, switchMap } from 'rxjs';
import { RoleCode } from '../../../../core/config/permissions/permissions';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { LocationOption, Role, needsLocationChoice } from '../../domain/entities/user';

export type AccessForm = FormGroup<{
  role: FormControl<RoleCode | null>;
  allLocations: FormControl<boolean>;
  locationIds: FormControl<string[]>;
}>;

/**
 * Role and location access. Adapts to the company: with a single location the
 * choice is implicit (selected automatically, no selector shown).
 */
@Component({
  selector: 'app-user-access-fields',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    SelectModule,
    MultiSelectModule,
    CheckboxModule,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-5" [formGroup]="form()">
      @if (showRole()) {
        <app-form-field
          [label]="'users.fields.role' | translate"
          forId="user-role"
          [control]="form().controls.role"
          [required]="true"
        >
          <p-select
            inputId="user-role"
            ariaLabelledBy="user-role-label"
            formControlName="role"
            [options]="roleOptions()"
            optionLabel="label"
            optionValue="value"
            styleClass="w-full"
          />
        </app-form-field>
      }
      @if (locationChoice() && locations().length > 1) {
        <div class="flex items-center gap-2">
          <p-checkbox inputId="user-all-locations" formControlName="allLocations" [binary]="true" />
          <label for="user-all-locations" class="text-sm text-fg">{{
            'users.fields.allLocations' | translate
          }}</label>
        </div>
        @if (!allLocations()) {
          <app-form-field
            [label]="'users.fields.locations' | translate"
            forId="user-locations"
            [control]="form().controls.locationIds"
            [required]="true"
          >
            <p-multiselect
              inputId="user-locations"
              ariaLabelledBy="user-locations-label"
              formControlName="locationIds"
              [options]="locationOptions()"
              optionLabel="name"
              optionValue="id"
              display="chip"
              styleClass="w-full"
            />
          </app-form-field>
        }
      } @else if (!locationChoice()) {
        <p class="flex items-center gap-2 text-sm text-fg-muted">
          <i class="pi pi-info-circle" aria-hidden="true"></i
          >{{ 'users.hints.adminAllLocations' | translate }}
        </p>
      }
    </div>
  `,
})
export class UserAccessFields {
  readonly form = input.required<AccessForm>();
  readonly roles = input.required<readonly Role[]>();
  readonly locations = input.required<readonly LocationOption[]>();
  readonly roleLabels = input.required<Record<string, string>>();
  readonly showRole = input(true);

  /** Current form value as a signal, following form input changes. */
  private readonly value = toSignal(
    toObservable(this.form).pipe(
      switchMap((form) => form.valueChanges.pipe(startWith(form.getRawValue()))),
    ),
  );
  protected readonly allLocations = computed(() => this.value()?.allLocations ?? false);
  protected readonly locationChoice = computed(() => {
    const role = this.value()?.role ?? null;
    return role === null || needsLocationChoice(role);
  });
  protected readonly locationOptions = computed(() => [...this.locations()]);
  protected readonly roleOptions = computed(() =>
    this.roles().map((role) => ({
      value: role.code,
      label: this.roleLabels()[role.code] ?? role.code,
    })),
  );

  constructor() {
    // Single-location companies: assign it automatically, the user never has to choose.
    effect(() => {
      const locations = this.locations();
      const form = this.form();
      const only = locations.length === 1 ? locations[0] : undefined;
      if (only && form.controls.locationIds.value.length === 0) {
        form.controls.locationIds.setValue([only.id]);
      }
    });
  }
}

/** Location selection is required unless "all locations" is checked. */
export function locationsRequired(group: AccessForm): { locationsRequired: true } | null {
  const { role, allLocations, locationIds } = group.getRawValue();
  if (role === null || !needsLocationChoice(role) || allLocations) return null;
  return locationIds.length > 0 ? null : { locationsRequired: true };
}
