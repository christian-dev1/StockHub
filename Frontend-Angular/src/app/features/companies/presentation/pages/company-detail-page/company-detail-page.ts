import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { CompanyStatusBadge } from '../../components/company-status-badge';
import { AdminAccountFields } from '../../forms/admin-account-fields';
import { adminForm, profileForm, toAdmin, toProfile } from '../../forms/company-forms';
import { CompanyProfileFields } from '../../forms/company-profile-fields';
import { CompanyDetailStore } from '../../state/company-detail.store';

@Component({
  selector: 'app-company-detail-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    DialogModule,
    SkeletonModule,
    TextareaModule,
    ErrorState,
    FormField,
    PageHeader,
    CompanyStatusBadge,
    CompanyProfileFields,
    AdminAccountFields,
  ],
  providers: [CompanyDetailStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-detail-page.html',
})
export class CompanyDetailPage implements OnInit {
  /** Route parameter bound by the router. */
  readonly companyId = input.required<string>();

  protected readonly store = inject(CompanyDetailStore);
  private readonly notifier = inject(Notifier);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly routes = APP_ROUTES;
  protected readonly profile = profileForm(this.fb);
  protected readonly admin = adminForm(this.fb);
  protected readonly disableReason = this.fb.control('', [
    Validators.required,
    Validators.maxLength(500),
  ]);
  protected readonly savingProfile = signal(false);
  protected readonly statusDialog = signal(false);
  protected readonly adminDialog = signal(false);
  protected readonly busy = signal(false);

  constructor() {
    effect(() => {
      const company = this.store.company();
      if (company && !this.profile.dirty) {
        this.profile.reset(profileForm(this.fb, company).getRawValue());
      }
    });
  }

  ngOnInit(): void {
    this.store.load(this.companyId());
  }

  protected saveProfile(): void {
    if (this.profile.invalid) {
      this.profile.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    this.store.saveProfile(toProfile(this.profile)).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profile.markAsPristine();
        this.notifier.success('common.saved');
      },
      error: (error: AppError) => {
        this.savingProfile.set(false);
        if (!applyServerErrors(this.profile, error)) this.notifier.error(error);
      },
    });
  }

  protected confirmDisable(): void {
    if (this.disableReason.invalid) {
      this.disableReason.markAsTouched();
      return;
    }
    this.busy.set(true);
    this.store.disable(this.disableReason.value).subscribe({
      next: () => this.done('companies.detail.disabled', () => this.statusDialog.set(false)),
      error: (error: AppError) => this.failed(error),
    });
  }

  protected activate(): void {
    this.busy.set(true);
    this.store.activate().subscribe({
      next: () => this.done('companies.detail.activated'),
      error: (error: AppError) => this.failed(error),
    });
  }

  protected createAdmin(): void {
    if (this.admin.invalid) {
      this.admin.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.store.createAdmin(toAdmin(this.admin)).subscribe({
      next: () =>
        this.done('companies.detail.adminCreated', () => {
          this.adminDialog.set(false);
          this.admin.reset();
        }),
      error: (error: AppError) => {
        this.busy.set(false);
        if (
          !applyServerErrors(this.admin, {
            ...error,
            fieldErrors: error.fieldErrors.map((f) => ({
              ...f,
              field: f.field === 'password' ? 'temporaryPassword' : f.field,
            })),
          })
        ) {
          this.notifier.error(error);
        }
      },
    });
  }

  private done(messageKey: string, after?: () => void): void {
    this.busy.set(false);
    this.disableReason.reset('');
    after?.();
    this.notifier.success(messageKey);
  }

  private failed(error: AppError): void {
    this.busy.set(false);
    this.notifier.error(error);
  }
}
