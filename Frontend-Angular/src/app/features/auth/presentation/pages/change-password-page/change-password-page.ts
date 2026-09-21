import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { switchMap } from 'rxjs';
import { AuthApi } from '../../../../../core/auth/auth-api';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { mapHttpError } from '../../../../../core/errors/http-error.mapper';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { ErrorMessages } from '../../../../../shared/utils/error-message';
import { passwordStrength } from '../../../../../shared/utils/validators';
import { AuthLayout } from '../../components/auth-layout';

function matchingPasswords(group: AbstractControl): ValidationErrors | null {
  const value = group.value as { newPassword: string; confirmation: string };
  return value.newPassword === value.confirmation ? null : { mismatch: true };
}

/**
 * Mandatory after a temporary password, available anytime. The backend revokes
 * every session on success, so the user is signed in again with the new password.
 */
@Component({
  selector: 'app-change-password-page',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    FormField,
    AuthLayout,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password-page.html',
})
export class ChangePasswordPage {
  private readonly api = inject(AuthApi);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);
  private readonly errors = inject(ErrorMessages);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, passwordStrength]],
      confirmation: ['', Validators.required],
    },
    { validators: matchingPasswords },
  );
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const email = this.auth.session()?.email ?? '';
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.api
      .changePassword(currentPassword, newPassword)
      .pipe(switchMap(() => this.auth.login(email, newPassword)))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notifier.success('auth.changePassword.success');
          void this.router.navigateByUrl(APP_ROUTES.ROOT);
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          const appError = mapHttpError(error);
          if (
            !applyServerErrors(this.form, {
              ...appError,
              fieldErrors: appError.fieldErrors.map((f) => ({
                ...f,
                field: f.field === 'password' ? 'newPassword' : f.field,
              })),
            })
          ) {
            this.errorMessage.set(this.errors.of(appError));
          }
        },
      });
  }

  protected signOut(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl(APP_ROUTES.LOGIN));
  }
}
