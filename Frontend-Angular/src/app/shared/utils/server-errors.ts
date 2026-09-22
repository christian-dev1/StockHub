import { AbstractControl, FormGroup } from '@angular/forms';
import { AppError } from '../../core/errors/app-error';

/** Error stored on a control by {@link applyServerErrors}; FormField translates it by code. */
export interface ServerFieldError {
  readonly code: string;
  readonly message: string;
}

/**
 * Attaches backend field errors to the matching form controls (supports dotted
 * paths such as "profile.name"). Returns true when at least one was applied.
 * `aliases` maps backend field names to form paths (e.g. salePrice → pricing.salePrice).
 */
export function applyServerErrors(
  form: FormGroup,
  error: AppError,
  aliases: Record<string, string> = {},
): boolean {
  let applied = false;
  for (const fieldError of error.fieldErrors) {
    const control: AbstractControl | null = form.get(aliases[fieldError.field] ?? fieldError.field);
    if (control) {
      control.setErrors({
        ...(control.errors ?? {}),
        server: { code: fieldError.code, message: fieldError.message } satisfies ServerFieldError,
      });
      control.markAsTouched();
      applied = true;
    }
  }
  return applied;
}
