import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { SupplierForm } from './supplier-form';

/** Supplier inputs shared by the create and detail pages. */
@Component({
  selector: 'app-supplier-fields',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-5 sm:grid-cols-2" [formGroup]="form()">
      <app-form-field
        [label]="'suppliers.fields.name' | translate"
        forId="sup-name"
        [control]="form().controls.name"
        [required]="true"
      >
        <input
          pInputText
          id="sup-name"
          formControlName="name"
          class="w-full"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        [label]="'suppliers.fields.code' | translate"
        forId="sup-code"
        [control]="form().controls.code"
        [required]="codeRequired()"
        [hint]="codeRequired() ? undefined : ('suppliers.hints.code' | translate)"
      >
        <input
          pInputText
          id="sup-code"
          formControlName="code"
          class="w-full font-mono uppercase"
          autocomplete="off"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        [label]="'suppliers.fields.contactName' | translate"
        forId="sup-contact"
        [control]="form().controls.contactName"
      >
        <input
          pInputText
          id="sup-contact"
          formControlName="contactName"
          class="w-full"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        [label]="'suppliers.fields.email' | translate"
        forId="sup-email"
        [control]="form().controls.email"
      >
        <input
          pInputText
          id="sup-email"
          type="email"
          formControlName="email"
          class="w-full"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        [label]="'suppliers.fields.phone' | translate"
        forId="sup-phone"
        [control]="form().controls.phone"
      >
        <input
          pInputText
          id="sup-phone"
          type="tel"
          formControlName="phone"
          class="w-full"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        [label]="'suppliers.fields.leadTimeDays' | translate"
        forId="sup-lead"
        [control]="form().controls.leadTimeDays"
        [hint]="'suppliers.hints.leadTimeDays' | translate"
      >
        <p-inputnumber
          inputId="sup-lead"
          formControlName="leadTimeDays"
          [min]="0"
          [max]="365"
          [showButtons]="true"
          [fluid]="true"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        class="sm:col-span-2"
        [label]="'suppliers.fields.addressLine' | translate"
        forId="sup-address"
        [control]="form().controls.addressLine"
      >
        <input
          pInputText
          id="sup-address"
          formControlName="addressLine"
          class="w-full"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        [label]="'suppliers.fields.city' | translate"
        forId="sup-city"
        [control]="form().controls.city"
      >
        <input
          pInputText
          id="sup-city"
          formControlName="city"
          class="w-full"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        [label]="'suppliers.fields.country' | translate"
        forId="sup-country"
        [control]="form().controls.country"
        [hint]="'suppliers.hints.country' | translate"
      >
        <input
          pInputText
          id="sup-country"
          formControlName="country"
          maxlength="2"
          class="w-full uppercase"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        [label]="'suppliers.fields.taxId' | translate"
        forId="sup-tax"
        [control]="form().controls.taxId"
      >
        <input
          pInputText
          id="sup-tax"
          formControlName="taxId"
          class="w-full"
          [readonly]="readonly()"
        />
      </app-form-field>
      <app-form-field
        class="sm:col-span-2"
        [label]="'suppliers.fields.notes' | translate"
        forId="sup-notes"
        [control]="form().controls.notes"
      >
        <textarea
          pTextarea
          id="sup-notes"
          formControlName="notes"
          rows="3"
          class="w-full"
          [readonly]="readonly()"
        ></textarea>
      </app-form-field>
    </div>
  `,
})
export class SupplierFields {
  readonly form = input.required<SupplierForm>();
  readonly codeRequired = input(false);
  readonly readonly = input(false);
}
