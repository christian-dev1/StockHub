import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { ProfileForm } from './company-forms';

@Component({
  selector: 'app-company-profile-fields',
  imports: [ReactiveFormsModule, TranslatePipe, InputTextModule, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-5 sm:grid-cols-2" [formGroup]="form()">
      <app-form-field
        class="sm:col-span-2"
        [label]="'companies.fields.name' | translate"
        forId="co-name"
        [control]="form().controls.name"
        [required]="true"
      >
        <input
          pInputText
          id="co-name"
          formControlName="name"
          class="w-full"
          autocomplete="organization"
          aria-describedby="co-name-message"
        />
      </app-form-field>
      <app-form-field
        [label]="'companies.fields.legalName' | translate"
        forId="co-legal"
        [control]="form().controls.legalName"
      >
        <input
          pInputText
          id="co-legal"
          formControlName="legalName"
          class="w-full"
          aria-describedby="co-legal-message"
        />
      </app-form-field>
      <app-form-field
        [label]="'companies.fields.email' | translate"
        forId="co-email"
        [control]="form().controls.email"
      >
        <input
          pInputText
          id="co-email"
          type="email"
          formControlName="email"
          class="w-full"
          autocomplete="email"
          aria-describedby="co-email-message"
        />
      </app-form-field>
      <app-form-field
        [label]="'companies.fields.phone' | translate"
        forId="co-phone"
        [control]="form().controls.phone"
      >
        <input
          pInputText
          id="co-phone"
          type="tel"
          formControlName="phone"
          class="w-full"
          autocomplete="tel"
          aria-describedby="co-phone-message"
        />
      </app-form-field>
      <app-form-field
        [label]="'companies.fields.country' | translate"
        forId="co-country"
        [control]="form().controls.country"
        [hint]="'companies.hints.country' | translate"
      >
        <input
          pInputText
          id="co-country"
          formControlName="country"
          maxlength="2"
          class="w-full uppercase"
          autocomplete="country"
          aria-describedby="co-country-message"
        />
      </app-form-field>
      <app-form-field
        [label]="'companies.fields.addressLine' | translate"
        forId="co-address"
        [control]="form().controls.addressLine"
      >
        <input
          pInputText
          id="co-address"
          formControlName="addressLine"
          class="w-full"
          autocomplete="street-address"
          aria-describedby="co-address-message"
        />
      </app-form-field>
      <app-form-field
        [label]="'companies.fields.city' | translate"
        forId="co-city"
        [control]="form().controls.city"
      >
        <input
          pInputText
          id="co-city"
          formControlName="city"
          class="w-full"
          autocomplete="address-level2"
          aria-describedby="co-city-message"
        />
      </app-form-field>
    </div>
  `,
})
export class CompanyProfileFields {
  readonly form = input.required<ProfileForm>();
}
