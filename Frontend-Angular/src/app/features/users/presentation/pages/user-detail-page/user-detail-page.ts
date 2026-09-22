import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  WritableSignal,
  computed,
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
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { Confirmation } from '../../../../../shared/ui/confirm/confirmation';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { generateTemporaryPassword } from '../../../../../shared/utils/temporary-password';
import { passwordStrength } from '../../../../../shared/utils/validators';
import { RoleBadge, UserStatusBadge } from '../../components/user-badges';
import { UserAccessFields } from '../../forms/user-access-fields';
import { accessForm, profileForm } from '../../forms/user-forms';
import { UserDetailStore } from '../../state/user-detail.store';
import { UserReferenceStore } from '../../state/user-reference.store';
import { DateTimePipe } from '../../../../../shared/pipes/date-time.pipe';

@Component({
  selector: 'app-user-detail-page',
  imports: [
    DateTimePipe,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SkeletonModule,
    ErrorState,
    FormField,
    PageHeader,
    RoleBadge,
    UserStatusBadge,
    UserAccessFields,
  ],
  providers: [UserDetailStore, UserReferenceStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-detail-page.html',
})
export class UserDetailPage implements OnInit {
  readonly userId = input.required<string>();

  protected readonly store = inject(UserDetailStore);
  protected readonly reference = inject(UserReferenceStore);
  protected readonly auth = inject(AuthStore);
  private readonly notifier = inject(Notifier);
  private readonly confirmation = inject(Confirmation);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly routes = APP_ROUTES;
  protected readonly profile = profileForm(this.fb);
  protected readonly access = accessForm(this.fb);
  protected readonly temporaryPassword = this.fb.control('', [
    Validators.required,
    passwordStrength,
  ]);
  protected readonly savingProfile = signal(false);
  protected readonly savingAccess = signal(false);
  protected readonly passwordDialog = signal(false);
  protected readonly busy = signal(false);

  /** Admins cannot change their own role or status (enforced by the backend too). */
  protected readonly isSelf = computed(() => this.store.user()?.id === this.auth.session()?.id);
  protected readonly canEdit = computed(() => this.auth.can('USER_UPDATE'));
  protected readonly locationNames = computed(() => {
    const user = this.store.user();
    const names = this.reference.locationNames();
    return user ? user.locationIds.map((id) => names.get(id) ?? id) : [];
  });

  constructor() {
    effect(() => {
      const user = this.store.user();
      if (!user) return;
      if (!this.profile.dirty) this.profile.reset(profileForm(this.fb, user).getRawValue());
      if (!this.access.dirty) this.access.reset(accessForm(this.fb, user).getRawValue());
    });
    effect(() => (this.isSelf() || !this.canEdit() ? this.access.disable() : this.access.enable()));
  }

  ngOnInit(): void {
    this.store.load(this.userId());
    this.reference.load();
  }

  protected saveProfile(): void {
    if (this.profile.invalid) return this.profile.markAllAsTouched();
    const v = this.profile.getRawValue();
    this.savingProfile.set(true);
    this.store.saveProfile({ ...v, phone: v.phone || null }).subscribe({
      next: () => this.saved(this.savingProfile, () => this.profile.markAsPristine()),
      error: (error: AppError) =>
        this.failed(this.savingProfile, error, () => applyServerErrors(this.profile, error)),
    });
  }

  protected saveAccess(): void {
    if (this.access.invalid) return this.access.markAllAsTouched();
    const v = this.access.getRawValue();
    if (!v.role) return;
    this.savingAccess.set(true);
    this.store.saveAccess(v.role, v.allLocations, v.locationIds).subscribe({
      next: () => this.saved(this.savingAccess, () => this.access.markAsPristine()),
      error: (error: AppError) =>
        this.failed(this.savingAccess, error, () => applyServerErrors(this.access, error)),
    });
  }

  protected async toggleStatus(): Promise<void> {
    const user = this.store.user();
    if (!user) return;
    const disabling = user.status === 'ACTIVE';
    const confirmed = await this.confirmation.ask({
      titleKey: disabling ? 'users.actions.disable' : 'users.actions.activate',
      messageKey: disabling ? 'users.detail.confirmDisable' : 'users.detail.confirmActivate',
      params: { name: user.fullName },
      destructive: disabling,
    });
    if (!confirmed) return;
    this.busy.set(true);
    (disabling ? this.store.disable() : this.store.activate()).subscribe({
      next: () => this.saved(this.busy),
      error: (error: AppError) => this.failed(this.busy, error),
    });
  }

  protected generatePassword(): void {
    this.temporaryPassword.setValue(generateTemporaryPassword());
    this.temporaryPassword.markAsDirty();
  }

  protected resetPassword(): void {
    if (this.temporaryPassword.invalid) return this.temporaryPassword.markAsTouched();
    this.busy.set(true);
    this.store.resetPassword(this.temporaryPassword.value).subscribe({
      next: () =>
        this.saved(
          this.busy,
          () => {
            this.passwordDialog.set(false);
            this.temporaryPassword.reset('');
          },
          'users.detail.passwordReset',
        ),
      error: (error: AppError) => this.failed(this.busy, error),
    });
  }

  private saved(
    flag: WritableSignal<boolean>,
    after?: () => void,
    messageKey = 'common.saved',
  ): void {
    flag.set(false);
    after?.();
    this.notifier.success(messageKey);
  }

  private failed(
    flag: WritableSignal<boolean>,
    error: AppError,
    applyFields?: () => boolean,
  ): void {
    flag.set(false);
    if (!applyFields?.()) this.notifier.error(error);
  }
}
