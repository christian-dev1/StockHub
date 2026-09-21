import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Mirrors the backend PasswordPolicy (10–128 chars, letters and digits). */
export function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return null;
  if (value.length < 10 || value.length > 128) return { passwordLength: { min: 10, max: 128 } };
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) return { passwordWeak: true };
  return null;
}
