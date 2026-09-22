import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { CalendarDatePipe } from '../../../../../shared/pipes/calendar-date.pipe';
import { QuantityPipe } from '../../../../../shared/pipes/quantity.pipe';
import {
  CellTemplate,
  DataTable,
  TableColumn,
} from '../../../../../shared/ui/data-table/data-table';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { PagedList } from '../../../../../shared/utils/paged-list';
import {
  Batch,
  BatchFilters,
  EMPTY_BATCH_FILTERS,
  ExpiryStatus,
  StockProduct,
} from '../../../domain/entities/stock';
import { SearchBatchesUseCase } from '../../../domain/use-cases/stock.use-cases';
import { ProductPicker } from '../../components/product-picker';
import { ExpiryBadge } from '../../components/stock-badges';
import { StockContext } from '../../state/stock-context';
import { StockLookups } from '../../state/stock-lookups';

/**
 * Batches and their expiry. Quick filters answer the daily questions
 * ("what expires soon?", "what has expired?"); dates narrow further.
 */
@Component({
  selector: 'app-batches-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    InputTextModule,
    SelectModule,
    CalendarDatePipe,
    QuantityPipe,
    PageHeader,
    DataTable,
    CellTemplate,
    SearchField,
    ProductPicker,
    ExpiryBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './batches-page.html',
})
export class BatchesPage implements OnInit {
  private readonly search = inject(SearchBatchesUseCase);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);
  protected readonly context = inject(StockContext);
  protected readonly lookups = inject(StockLookups);

  protected readonly routes = APP_ROUTES;
  protected readonly list = new PagedList<Batch, BatchFilters>(
    (request, filters) => this.search.execute(request, filters),
    EMPTY_BATCH_FILTERS,
    inject(DestroyRef),
    { field: 'expirationDate', direction: 'asc' },
  );
  protected readonly rowKey = (batch: Batch) => batch.id;
  protected readonly product = signal<StockProduct | null>(null);
  protected readonly filtersOpen = signal(false);
  private readonly t = (key: string) => this.translate.instant(key) as string;

  protected readonly quickFilters: readonly ExpiryStatus[] = ['EXPIRING_SOON', 'EXPIRED'];

  protected readonly columns = computed<TableColumn[]>(() => {
    this.language.language();
    const columns: TableColumn[] = [
      {
        key: 'batchNumber',
        header: this.t('stock.fields.batchNumber'),
        sortable: true,
        primary: true,
      },
      { key: 'productId', header: this.t('stock.fields.product') },
    ];
    if (this.context.multiLocation()) {
      columns.push({ key: 'locationId', header: this.t('stock.fields.location'), hideBelow: 'lg' });
    }
    columns.push(
      { key: 'quantity', header: this.t('stock.fields.quantity'), sortable: true, align: 'end' },
      {
        key: 'manufacturingDate',
        header: this.t('stock.fields.manufacturingDate'),
        hideBelow: 'xl',
      },
      {
        key: 'expirationDate',
        header: this.t('stock.fields.expirationDate'),
        sortable: true,
      },
      { key: 'expiryStatus', header: this.t('stock.fields.status') },
    );
    return columns;
  });

  protected readonly statusOptions = computed(() => {
    this.language.language();
    return (['VALID', 'EXPIRING_SOON', 'EXPIRED'] as const).map((status) => ({
      value: status,
      label: this.t(`stock.expiry.${status}`),
    }));
  });
  protected readonly locationOptions = computed(() => this.context.locationOptions());
  protected readonly activeFilters = computed(() => {
    const f = this.list.filters();
    return [f.productId, f.locationId, f.status, f.expirationFrom, f.expirationTo].filter(
      (value) => value !== null,
    ).length;
  });

  constructor() {
    effect(() => {
      const rows = this.list.rows();
      untracked(() => this.lookups.resolve(rows));
    });
  }

  ngOnInit(): void {
    this.list.load();
  }

  protected filter(change: Partial<BatchFilters>): void {
    this.list.applyFilters({ ...this.list.filters(), ...change });
  }

  protected toggleStatus(status: ExpiryStatus): void {
    this.filter({ status: this.list.filters().status === status ? null : status });
  }

  protected chooseProduct(product: StockProduct | null): void {
    this.product.set(product);
    this.filter({ productId: product?.id ?? null });
  }

  protected clearFilters(): void {
    this.product.set(null);
    this.list.clearFilters();
  }

  protected productName(id: string): string {
    return this.lookups.product(id)?.name ?? '…';
  }
}
