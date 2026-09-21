import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { currencyOptions, timeZoneOptions } from '../../../../../shared/utils/intl-options';
import { OnboardCompanyUseCase } from '../../../domain/use-cases/company.use-cases';
import { AdminAccountFields } from '../../forms/admin-account-fields';
import { adminForm, profileForm, toAdmin, toProfile } from '../../forms/company-forms';
import { CompanyProfileFields } from '../../forms/company-profile-fields';

@Component({
  selector: 'app-company-create-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    SelectModule,
    FormField,
    PageHeader,
    CompanyProfileFields,
    AdminAccountFields,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-create-page.html',
})
export class CompanyCreatePage {
  private readonly onboard = inject(OnboardCompanyUseCase);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly routes = APP_ROUTES;
  protected readonly currencies = currencyOptions();
  protected readonly timeZones = timeZoneOptions();
  protected readonly locales = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ];
  protected readonly form = this.fb.group({
    profile: profileForm(this.fb),
    currency: ['XAF', Validators.required],
    timezone: ['Africa/Douala', Validators.required],
    locale: ['fr' as 'fr' | 'en', Validators.required],
    admin: adminForm(this.fb),
  });
  protected readonly saving = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.onboard
      .execute({
        profile: toProfile(this.form.controls.profile),
        currency: v.currency,
        timezone: v.timezone,
        locale: v.locale,
        admin: toAdmin(this.form.controls.admin),
      })
      .subscribe({
        next: (company) => {
          this.notifier.success('companies.create.success', { name: company.name });
          void this.router.navigateByUrl(APP_ROUTES.PLATFORM.COMPANY_DETAIL(company.id));
        },
        error: (error: AppError) => {
          this.saving.set(false);
          const mapped = {
            ...error,
            fieldErrors: error.fieldErrors.map((f) => ({ ...f, field: serverField(f.field) })),
          };
          if (!applyServerErrors(this.form, mapped)) {
            this.notifier.error(error);
          }
        },
      });
  }
}

/** Maps backend field names (possibly business-level) onto this form's controls. */
function serverField(field: string): string {
  const aliases: Record<string, string> = {
    password: 'admin.temporaryPassword',
    name: 'profile.name',
  };
  return aliases[field] ?? field;
}
