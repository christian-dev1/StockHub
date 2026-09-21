import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { mapHttpError } from '../../../../../core/errors/http-error.mapper';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { ErrorMessages } from '../../../../../shared/utils/error-message';
import { AuthLayout } from '../../components/auth-layout';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    FormField,
    AuthLayout,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
})
export class LoginPage {
  /** Query params bound by the router. */
  readonly returnUrl = input<string>();
  readonly expired = input<string>();

  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly errors = inject(ErrorMessages);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly sessionExpired = computed(() => this.expired() === '1');

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (session) => {
        this.submitting.set(false);
        const target = session.mustChangePassword
          ? APP_ROUTES.CHANGE_PASSWORD
          : this.safeReturnUrl();
        void this.router.navigateByUrl(target);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.errors.of(mapHttpError(error)));
      },
    });
  }

  /** Only same-app relative paths are accepted (no open redirect). */
  private safeReturnUrl(): string {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') ? url : APP_ROUTES.ROOT;
  }
}
