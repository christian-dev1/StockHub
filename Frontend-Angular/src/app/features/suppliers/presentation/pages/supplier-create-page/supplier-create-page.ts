import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { SaveSupplierUseCase } from '../../../domain/use-cases/supplier.use-cases';
import { SupplierFields } from '../../forms/supplier-fields';
import { supplierForm, toSupplierDraft } from '../../forms/supplier-form';

@Component({
  selector: 'app-supplier-create-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    PageHeader,
    SupplierFields,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-create-page.html',
})
export class SupplierCreatePage {
  private readonly save = inject(SaveSupplierUseCase);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);

  protected readonly routes = APP_ROUTES;
  protected readonly form = supplierForm(inject(NonNullableFormBuilder));
  protected readonly saving = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.save.create(toSupplierDraft(this.form)).subscribe({
      next: (supplier) => {
        this.notifier.success('suppliers.saved.created', { name: supplier.name });
        void this.router.navigateByUrl(APP_ROUTES.SUPPLIERS.DETAIL(supplier.id));
      },
      error: (error: AppError) => {
        this.saving.set(false);
        if (!applyServerErrors(this.form, error)) this.notifier.error(error);
      },
    });
  }
}
