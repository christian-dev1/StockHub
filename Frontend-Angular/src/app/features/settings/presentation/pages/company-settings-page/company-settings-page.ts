import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { AppError } from '../../../../../core/errors/app-error';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { currencyOptions, timeZoneOptions } from '../../../../../shared/utils/intl-options';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { CurrentCompany } from '../../../domain/entities/company-settings';
import { CompanySettingsStore } from '../../state/company-settings.store';

@Component({
  selector: 'app-company-settings-page',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    ToggleSwitchModule,
    ErrorState,
    FormField,
    PageHeader,
  ],
  providers: [CompanySettingsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './company-settings-page.html',
})
export class CompanySettingsPage implements OnInit {
  protected readonly store = inject(CompanySettingsStore);
  private readonly auth = inject(AuthStore);
  private readonly notifier = inject(Notifier);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly canEdit = computed(() => this.auth.can('COMPANY_UPDATE'));
  protected readonly currencies = currencyOptions();
  protected readonly timeZones = timeZoneOptions();
  protected readonly locales = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ];

  protected readonly profile = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    legalName: ['', Validators.maxLength(200)],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.maxLength(40)],
    addressLine: ['', Validators.maxLength(255)],
    city: ['', Validators.maxLength(100)],
    country: ['', Validators.pattern(/^[A-Za-z]{2}$/)],
  });
  protected readonly settings = this.fb.group({
    currency: ['', Validators.required],
    timezone: ['', Validators.required],
    locale: ['fr' as 'fr' | 'en', Validators.required],
    allowNegativeStock: [false],
    expiryWarningDays: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
    defaultLeadTimeDays: [7, [Validators.required, Validators.min(0), Validators.max(365)]],
  });
  protected readonly savingProfile = signal(false);
  protected readonly savingSettings = signal(false);

  constructor() {
    effect(() => {
      const company = this.store.company();
      if (company) this.fill(company);
    });
    effect(() => {
      const forms = [this.profile, this.settings];
      forms.forEach((form) => (this.canEdit() ? form.enable() : form.disable()));
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected saveProfile(): void {
    this.submit(this.profile, this.savingProfile, () => {
      const v = this.profile.getRawValue();
      return this.store.saveProfile({
        ...v,
        legalName: v.legalName || null,
        email: v.email || null,
        phone: v.phone || null,
        addressLine: v.addressLine || null,
        city: v.city || null,
        country: v.country || null,
      });
    });
  }

  protected saveSettings(): void {
    this.submit(this.settings, this.savingSettings, () =>
      this.store.saveSettings(this.settings.getRawValue()),
    );
  }

  private submit(
    form: FormGroup,
    flag: WritableSignal<boolean>,
    request: () => ReturnType<CompanySettingsStore['saveProfile']>,
  ): void {
    if (form.invalid) return form.markAllAsTouched();
    flag.set(true);
    request().subscribe({
      next: () => {
        flag.set(false);
        form.markAsPristine();
        this.notifier.success('common.saved');
      },
      error: (error: AppError) => {
        flag.set(false);
        if (!applyServerErrors(form, error)) this.notifier.error(error);
      },
    });
  }

  private fill(company: CurrentCompany): void {
    if (!this.profile.dirty) {
      this.profile.reset({
        name: company.name,
        legalName: company.legalName ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        addressLine: company.addressLine ?? '',
        city: company.city ?? '',
        country: company.country ?? '',
      });
    }
    if (!this.settings.dirty) {
      this.settings.reset({
        currency: company.currency,
        timezone: company.timezone,
        locale: company.locale,
        allowNegativeStock: company.allowNegativeStock,
        expiryWarningDays: company.expiryWarningDays,
        defaultLeadTimeDays: company.defaultLeadTimeDays,
      });
    }
  }
}
