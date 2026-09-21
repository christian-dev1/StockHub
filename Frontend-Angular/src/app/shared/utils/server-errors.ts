import { AbstractControl, FormGroup } from '@angular/forms';
import { AppError } from '../../core/errors/app-error';

/**
 * Attaches backend field errors to the matching form controls (supports dotted
 * paths such as "profile.name"). Returns true when at least one was applied.
 */
export function applyServerErrors(form: FormGroup, error: AppError): boolean {
  let applied = false;
  for (const fieldError of error.fieldErrors) {
    const control: AbstractControl | null = form.get(fieldError.field);
    if (control) {
      control.setErrors({
        ...(control.errors ?? {}),
        server: fieldError.message || fieldError.code,
      });
      control.markAsTouched();
      applied = true;
    }
  }
  return applied;
}
