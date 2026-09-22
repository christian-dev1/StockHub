import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { Confirmation } from '../../../../../shared/ui/confirm/confirmation';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { ActiveBadge } from '../../../../../shared/ui/status-badge/active-badge';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { SupplierFields } from '../../forms/supplier-fields';
import { supplierForm, toSupplierDraft } from '../../forms/supplier-form';
import { SupplierDetailStore } from '../../state/supplier-detail.store';

@Component({
  selector: 'app-supplier-detail-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    SkeletonModule,
    ErrorState,
    PageHeader,
    ActiveBadge,
    SupplierFields,
  ],
  providers: [SupplierDetailStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-detail-page.html',
})
export class SupplierDetailPage implements OnInit {
  readonly supplierId = input.required<string>();

  protected readonly store = inject(SupplierDetailStore);
  private readonly auth = inject(AuthStore);
  private readonly confirmation = inject(Confirmation);
  private readonly notifier = inject(Notifier);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly routes = APP_ROUTES;
  protected readonly form = supplierForm(this.fb, null);
  protected readonly canEdit = computed(() => this.auth.can('SUPPLIER_UPDATE'));
  protected readonly saving = signal(false);
  protected readonly busy = signal(false);

  constructor() {
    effect(() => {
      const supplier = this.store.supplier();
      if (supplier && this.form.pristine) {
        // The code becomes mandatory once it exists.
        const fresh = supplierForm(this.fb, supplier);
        this.form.controls.code.setValidators(fresh.controls.code.validator);
        this.form.reset(fresh.getRawValue());
      }
    });
  }

  ngOnInit(): void {
    this.store.load(this.supplierId());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.store.save(toSupplierDraft(this.form)).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.notifier.success('common.saved');
      },
      error: (error: AppError) => {
        this.saving.set(false);
        if (!applyServerErrors(this.form, error)) this.notifier.error(error);
      },
    });
  }

  protected async toggleStatus(): Promise<void> {
    const supplier = this.store.supplier();
    if (!supplier) return;
    const disabling = supplier.active;
    const confirmed = await this.confirmation.ask({
      titleKey: disabling ? 'suppliers.actions.deactivate' : 'suppliers.actions.activate',
      messageKey: disabling ? 'suppliers.confirm.deactivate' : 'suppliers.confirm.activate',
      params: { name: supplier.name },
      destructive: disabling,
    });
    if (!confirmed) return;
    this.busy.set(true);
    this.store.toggleStatus().subscribe({
      next: () => {
        this.busy.set(false);
        this.notifier.success('common.saved');
      },
      error: (error: AppError) => {
        this.busy.set(false);
        this.notifier.error(error);
      },
    });
  }
}
