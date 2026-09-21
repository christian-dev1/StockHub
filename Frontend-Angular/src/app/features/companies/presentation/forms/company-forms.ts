import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { passwordStrength } from '../../../../shared/utils/validators';
import { AdminAccount, CompanyProfile } from '../../domain/entities/company';

export type ProfileForm = FormGroup<{
  name: FormControl<string>;
  legalName: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  addressLine: FormControl<string>;
  city: FormControl<string>;
  country: FormControl<string>;
}>;

export type AdminForm = FormGroup<{
  email: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  temporaryPassword: FormControl<string>;
}>;

export function profileForm(fb: NonNullableFormBuilder, value?: CompanyProfile): ProfileForm {
  return fb.group({
    name: [value?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    legalName: [value?.legalName ?? '', Validators.maxLength(200)],
    email: [value?.email ?? '', [Validators.email, Validators.maxLength(254)]],
    phone: [value?.phone ?? '', Validators.maxLength(40)],
    addressLine: [value?.addressLine ?? '', Validators.maxLength(255)],
    city: [value?.city ?? '', Validators.maxLength(100)],
    country: [value?.country ?? '', Validators.pattern(/^[A-Za-z]{2}$/)],
  });
}

export function adminForm(fb: NonNullableFormBuilder): AdminForm {
  return fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    temporaryPassword: ['', [Validators.required, passwordStrength]],
  });
}

export function toProfile(form: ProfileForm): CompanyProfile {
  const v = form.getRawValue();
  return {
    ...v,
    legalName: v.legalName || null,
    email: v.email || null,
    phone: v.phone || null,
    addressLine: v.addressLine || null,
    city: v.city || null,
    country: v.country || null,
  };
}

export function toAdmin(form: AdminForm): AdminAccount {
  return form.getRawValue();
}
