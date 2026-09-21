import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { CreateUserUseCase } from '../../../domain/use-cases/user.use-cases';
import { generateTemporaryPassword } from '../../../../../shared/utils/temporary-password';
import { UserAccessFields } from '../../forms/user-access-fields';
import { newUserForm } from '../../forms/user-forms';
import { UserReferenceStore } from '../../state/user-reference.store';

@Component({
  selector: 'app-user-create-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    FormField,
    PageHeader,
    UserAccessFields,
  ],
  providers: [UserReferenceStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-create-page.html',
})
export class UserCreatePage implements OnInit {
  private readonly createUser = inject(CreateUserUseCase);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);
  protected readonly reference = inject(UserReferenceStore);

  protected readonly routes = APP_ROUTES;
  protected readonly form = newUserForm(inject(NonNullableFormBuilder));
  protected readonly saving = signal(false);

  ngOnInit(): void {
    this.reference.load();
  }

  protected generatePassword(): void {
    this.form.controls.temporaryPassword.setValue(generateTemporaryPassword());
    this.form.controls.temporaryPassword.markAsDirty();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const role = v.access.role;
    if (!role) return;
    this.saving.set(true);
    this.createUser
      .execute({
        email: v.email,
        firstName: v.profile.firstName,
        lastName: v.profile.lastName,
        phone: v.profile.phone || null,
        role,
        allLocations: v.access.allLocations,
        locationIds: v.access.locationIds,
        temporaryPassword: v.temporaryPassword,
      })
      .subscribe({
        next: (user) => {
          this.notifier.success('users.create.success', { name: user.fullName });
          void this.router.navigateByUrl(APP_ROUTES.USERS.DETAIL(user.id));
        },
        error: (error: AppError) => {
          this.saving.set(false);
          const aliases: Record<string, string> = {
            password: 'temporaryPassword',
            firstName: 'profile.firstName',
            lastName: 'profile.lastName',
            locationIds: 'access.locationIds',
            role: 'access.role',
          };
          const mapped = {
            ...error,
            fieldErrors: error.fieldErrors.map((f) => ({
              ...f,
              field: aliases[f.field] ?? f.field,
            })),
          };
          if (!applyServerErrors(this.form, mapped)) this.notifier.error(error);
        },
      });
  }
}
