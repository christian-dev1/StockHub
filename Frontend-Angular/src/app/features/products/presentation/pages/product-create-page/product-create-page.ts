import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { SaveProductUseCase } from '../../../domain/use-cases/product.use-cases';
import { ProductFields } from '../../forms/product-fields';
import { linkTracking, productForm, toProductDraft } from '../../forms/product-form';
import { ProductReferencesStore } from '../../state/product-references.store';

@Component({
  selector: 'app-product-create-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    PageHeader,
    ProductFields,
  ],
  providers: [ProductReferencesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-create-page.html',
})
export class ProductCreatePage implements OnInit {
  private readonly save = inject(SaveProductUseCase);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);
  private readonly auth = inject(AuthStore);
  protected readonly references = inject(ProductReferencesStore);

  protected readonly routes = APP_ROUTES;
  protected readonly form = productForm(inject(NonNullableFormBuilder));
  protected readonly saving = signal(false);
  protected readonly currency = computed(() => this.auth.company()?.currency ?? 'XAF');
  protected readonly supplierOptions = computed(() => this.references.supplierOptions());

  constructor() {
    linkTracking(this.form, inject(DestroyRef));
  }

  ngOnInit(): void {
    this.references.load();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.save.create(toProductDraft(this.form), this.form.controls.active.value).subscribe({
      next: (product) => {
        this.notifier.success('products.saved.created', { name: product.name });
        void this.router.navigateByUrl(APP_ROUTES.PRODUCTS.DETAIL(product.id));
      },
      error: (error: AppError) => {
        this.saving.set(false);
        if (!applyServerErrors(this.form, error)) this.notifier.error(error);
      },
    });
  }
}
