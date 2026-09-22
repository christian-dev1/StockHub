import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
import { BarcodePanel } from '../../../../barcodes/presentation/components/barcode-panel';
import { GeneratedBarcode } from '../../../../barcodes/domain/entities/barcode';
import { BarcodeFormat } from '../../../domain/entities/product';
import { ProductImagePanel } from '../../components/product-image-panel';
import { ProductFields } from '../../forms/product-fields';
import { linkTracking, productForm, toProductDraft } from '../../forms/product-form';
import { ProductDetailStore } from '../../state/product-detail.store';
import { ProductReferencesStore } from '../../state/product-references.store';

@Component({
  selector: 'app-product-detail-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    SkeletonModule,
    ErrorState,
    PageHeader,
    ActiveBadge,
    ProductFields,
    ProductImagePanel,
    BarcodePanel,
  ],
  providers: [ProductDetailStore, ProductReferencesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail-page.html',
})
export class ProductDetailPage implements OnInit {
  readonly productId = input.required<string>();

  protected readonly store = inject(ProductDetailStore);
  protected readonly references = inject(ProductReferencesStore);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly confirmation = inject(Confirmation);
  private readonly notifier = inject(Notifier);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly routes = APP_ROUTES;
  protected readonly form = productForm(this.fb);
  protected readonly canEdit = computed(() => this.auth.can('PRODUCT_UPDATE'));
  protected readonly canDelete = computed(() => this.auth.can('PRODUCT_DELETE'));
  protected readonly canGenerate = computed(() => this.auth.can('BARCODE_GENERATE'));
  protected readonly canPrint = computed(() => this.auth.can('BARCODE_PRINT'));
  protected readonly currency = computed(() => this.auth.company()?.currency ?? 'XAF');
  protected readonly supplierOptions = computed(() => {
    const product = this.store.product();
    return this.references.supplierOptions({
      id: product?.defaultSupplierId ?? null,
      name: product?.defaultSupplierName ?? null,
    });
  });
  protected readonly categoryOptions = computed(() => {
    const product = this.store.product();
    const options = this.references.categoryOptions();
    if (product?.categoryId && !options.some((o) => o.value === product.categoryId)) {
      return [{ value: product.categoryId, label: product.categoryName ?? '' }, ...options];
    }
    return options;
  });
  protected readonly saving = signal(false);
  protected readonly busy = signal(false);

  constructor() {
    linkTracking(this.form, inject(DestroyRef));
    effect(() => {
      const product = this.store.product();
      if (product && this.form.pristine) {
        this.form.reset(productForm(this.fb, product).getRawValue());
      }
    });
  }

  ngOnInit(): void {
    this.store.load(this.productId());
    this.references.load();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.store.save(toProductDraft(this.form)).subscribe({
      next: (product) => {
        this.saving.set(false);
        this.form.reset(productForm(this.fb, product).getRawValue());
        this.notifier.success('common.saved');
      },
      error: (error: AppError) => {
        this.saving.set(false);
        if (!applyServerErrors(this.form, error)) this.notifier.error(error);
      },
    });
  }

  protected async toggleStatus(): Promise<void> {
    const product = this.store.product();
    if (!product) return;
    const disabling = product.active;
    const confirmed = await this.confirmation.ask({
      titleKey: disabling ? 'products.actions.deactivate' : 'products.actions.activate',
      messageKey: disabling ? 'products.confirm.deactivate' : 'products.confirm.activate',
      params: { name: product.name },
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

  protected async remove(): Promise<void> {
    const product = this.store.product();
    if (!product) return;
    const confirmed = await this.confirmation.ask({
      titleKey: 'products.actions.delete',
      messageKey: 'products.confirm.delete',
      params: { name: product.name },
      acceptKey: 'products.actions.delete',
      destructive: true,
    });
    if (!confirmed) return;
    this.busy.set(true);
    this.store.delete().subscribe({
      next: () => {
        this.notifier.success('products.saved.deleted', { name: product.name });
        void this.router.navigateByUrl(APP_ROUTES.PRODUCTS.ROOT);
      },
      error: (error: AppError) => {
        this.busy.set(false);
        this.notifier.error(error);
      },
    });
  }

  protected imageChanged(hasImage: boolean): void {
    this.store.patch({ hasImage });
  }

  /** The barcode fields of the form follow the generated value (unless being edited). */
  protected barcodeGenerated(barcode: GeneratedBarcode): void {
    const format = barcode.format as BarcodeFormat;
    this.store.patch({ barcode: barcode.barcode, barcodeFormat: format });
    const { barcode: value, barcodeFormat } = this.form.controls;
    if (value.pristine) value.reset(barcode.barcode);
    if (barcodeFormat.pristine) barcodeFormat.reset(format);
  }
}
