import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { generateTemporaryPassword } from '../../../../shared/utils/temporary-password';
import { AdminForm } from './company-forms';

@Component({
  selector: 'app-admin-account-fields',
  imports: [ReactiveFormsModule, TranslatePipe, InputTextModule, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-5 sm:grid-cols-2" [formGroup]="form()">
      <app-form-field
        [label]="'users.fields.firstName' | translate"
        [forId]="prefix() + '-first'"
        [control]="form().controls.firstName"
        [required]="true"
      >
        <input
          pInputText
          [id]="prefix() + '-first'"
          formControlName="firstName"
          class="w-full"
          autocomplete="off"
        />
      </app-form-field>
      <app-form-field
        [label]="'users.fields.lastName' | translate"
        [forId]="prefix() + '-last'"
        [control]="form().controls.lastName"
        [required]="true"
      >
        <input
          pInputText
          [id]="prefix() + '-last'"
          formControlName="lastName"
          class="w-full"
          autocomplete="off"
        />
      </app-form-field>
      <app-form-field
        class="sm:col-span-2"
        [label]="'users.fields.email' | translate"
        [forId]="prefix() + '-email'"
        [control]="form().controls.email"
        [required]="true"
      >
        <input
          pInputText
          [id]="prefix() + '-email'"
          type="email"
          formControlName="email"
          class="w-full"
          autocomplete="off"
        />
      </app-form-field>
      <app-form-field
        class="sm:col-span-2"
        [label]="'users.fields.temporaryPassword' | translate"
        [forId]="prefix() + '-password'"
        [control]="form().controls.temporaryPassword"
        [required]="true"
        [hint]="'users.hints.temporaryPassword' | translate"
      >
        <div class="flex gap-2">
          <input
            pInputText
            [id]="prefix() + '-password'"
            formControlName="temporaryPassword"
            class="w-full font-mono"
            autocomplete="off"
          />
          <button
            type="button"
            class="shrink-0 rounded-lg border border-border px-3 text-sm font-medium text-fg hover:bg-surface-muted"
            (click)="generate()"
          >
            <i class="pi pi-sparkles mr-1" aria-hidden="true"></i
            >{{ 'users.actions.generatePassword' | translate }}
          </button>
        </div>
      </app-form-field>
    </div>
  `,
})
export class AdminAccountFields {
  readonly form = input.required<AdminForm>();
  readonly prefix = input('admin');

  protected generate(): void {
    const control = this.form().controls.temporaryPassword;
    control.setValue(generateTemporaryPassword());
    control.markAsDirty();
  }
}
