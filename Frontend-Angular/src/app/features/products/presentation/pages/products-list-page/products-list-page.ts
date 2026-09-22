import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { MoneyPipe } from '../../../../../shared/pipes/money.pipe';
import {
  CellTemplate,
  DataTable,
  TableColumn,
} from '../../../../../shared/ui/data-table/data-table';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { ActiveBadge } from '../../../../../shared/ui/status-badge/active-badge';
import { PagedList } from '../../../../../shared/utils/paged-list';
import { EMPTY_PRODUCT_FILTERS, Product, ProductFilters } from '../../../domain/entities/product';
import { SearchProductsUseCase } from '../../../domain/use-cases/product.use-cases';
import { ProductThumbnail } from '../../components/product-thumbnail';
import { ProductReferencesStore } from '../../state/product-references.store';

@Component({
  selector: 'app-products-list-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    SelectModule,
    MoneyPipe,
    PageHeader,
    DataTable,
    CellTemplate,
    SearchField,
    ActiveBadge,
    ProductThumbnail,
  ],
  providers: [ProductReferencesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products-list-page.html',
})
export class ProductsListPage implements OnInit {
  private readonly search = inject(SearchProductsUseCase);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);
  protected readonly auth = inject(AuthStore);
  protected readonly references = inject(ProductReferencesStore);

  protected readonly routes = APP_ROUTES;
  protected readonly list = new PagedList<Product, ProductFilters>(
    (request, filters) => this.search.execute(request, filters),
    EMPTY_PRODUCT_FILTERS,
    inject(DestroyRef),
    { field: 'name', direction: 'asc' },
  );
  protected readonly rowKey = (product: Product) => product.id;
  private readonly t = (key: string) => this.translate.instant(key) as string;

  protected readonly columns = computed<TableColumn[]>(() => {
    this.language.language();
    return [
      { key: 'name', header: this.t('products.fields.name'), sortable: true, primary: true },
      {
        key: 'sku',
        header: this.t('products.fields.sku'),
        sortable: true,
        hideBelow: 'xl',
        hideInCards: true,
      },
      { key: 'barcode', header: this.t('products.fields.barcode'), hideBelow: 'lg' },
      { key: 'categoryName', header: this.t('products.fields.category'), hideBelow: 'lg' },
      { key: 'defaultSupplierName', header: this.t('products.fields.supplier'), hideBelow: 'xl' },
      {
        key: 'purchasePrice',
        header: this.t('products.fields.purchasePrice'),
        sortable: true,
        align: 'end',
        hideBelow: 'xl',
      },
      {
        key: 'salePrice',
        header: this.t('products.fields.salePrice'),
        sortable: true,
        align: 'end',
      },
      { key: 'active', header: this.t('products.fields.status') },
    ];
  });

  protected readonly yesNo = computed(() => {
    this.language.language();
    return {
      status: [
        { value: true, label: this.t('common.status.active') },
        { value: false, label: this.t('common.status.inactive') },
      ],
      barcode: [
        { value: true, label: this.t('products.filters.withBarcode') },
        { value: false, label: this.t('products.filters.withoutBarcode') },
      ],
      batch: [
        { value: true, label: this.t('products.filters.batchTracked') },
        { value: false, label: this.t('products.filters.notBatchTracked') },
      ],
    };
  });
  protected readonly supplierOptions = computed(() => this.references.supplierOptions());
  /** Phones and tablets fold the filters away; they are always shown on desktop. */
  protected readonly filtersOpen = signal(false);
  protected readonly activeFilters = computed(() => {
    const f = this.list.filters();
    return [f.categoryId, f.supplierId, f.active, f.hasBarcode, f.batchTracked].filter(
      (value) => value !== null,
    ).length;
  });

  ngOnInit(): void {
    this.references.load();
    this.list.load();
  }

  protected filter(change: Partial<ProductFilters>): void {
    this.list.applyFilters({ ...this.list.filters(), ...change });
  }

  protected open(product: Product): void {
    void this.router.navigateByUrl(APP_ROUTES.PRODUCTS.DETAIL(product.id));
  }
}
