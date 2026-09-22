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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DisplayTimeZone } from '../../../../../core/i18n/time-zone';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { DateTimePipe } from '../../../../../shared/pipes/date-time.pipe';
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
  EMPTY_MOVEMENT_FILTERS,
  MOVEMENT_TYPES,
  MovementFilters,
  StockMovement,
  StockProduct,
  increases,
  signedQuantity,
} from '../../../domain/entities/stock';
import {
  SearchMovementsUseCase,
  StockReferencesUseCase,
} from '../../../domain/use-cases/stock.use-cases';
import { ProductPicker } from '../../components/product-picker';
import { MovementTypeBadge } from '../../components/stock-badges';
import { StockContext } from '../../state/stock-context';
import { StockLookups } from '../../state/stock-lookups';

/** Read-only ledger. `?productId=` or `?reference=` open it pre-filtered. */
@Component({
  selector: 'app-stock-movements-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    InputTextModule,
    SelectModule,
    DateTimePipe,
    QuantityPipe,
    PageHeader,
    DataTable,
    CellTemplate,
    SearchField,
    ProductPicker,
    MovementTypeBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stock-movements-page.html',
})
export class StockMovementsPage implements OnInit {
  private readonly search = inject(SearchMovementsUseCase);
  private readonly references = inject(StockReferencesUseCase);
  private readonly timeZone = inject(DisplayTimeZone);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly context = inject(StockContext);
  protected readonly lookups = inject(StockLookups);

  protected readonly routes = APP_ROUTES;
  protected readonly list = new PagedList<StockMovement, MovementFilters>(
    (request, filters) => this.search.execute(request, filters, this.timeZone.zone()),
    EMPTY_MOVEMENT_FILTERS,
    inject(DestroyRef),
    { field: 'createdAt', direction: 'desc' },
  );
  protected readonly rowKey = (movement: StockMovement) => movement.id;
  protected readonly filtersOpen = signal(false);
  /** Product shown in the picker; the list filters on its id. */
  protected readonly product = signal<StockProduct | null>(null);
  private readonly t = (key: string) => this.translate.instant(key) as string;

  protected readonly columns = computed<TableColumn[]>(() => {
    this.language.language();
    const columns: TableColumn[] = [
      { key: 'productId', header: this.t('stock.fields.product'), primary: true },
      { key: 'createdAt', header: this.t('stock.fields.date'), sortable: true },
      { key: 'reference', header: this.t('stock.fields.reference'), sortable: true },
    ];
    if (this.context.multiLocation()) {
      columns.push({ key: 'locationId', header: this.t('stock.fields.location'), hideBelow: 'lg' });
    }
    columns.push(
      { key: 'type', header: this.t('stock.fields.type'), sortable: true },
      { key: 'quantity', header: this.t('stock.fields.quantity'), align: 'end' },
      {
        key: 'previousQuantity',
        header: this.t('stock.fields.before'),
        align: 'end',
        hideBelow: 'xl',
        hideInCards: true,
      },
      { key: 'newQuantity', header: this.t('stock.fields.after'), align: 'end', hideBelow: 'lg' },
      { key: 'performedBy', header: this.t('stock.fields.user'), hideBelow: 'xl' },
    );
    if (this.context.canSeeBatches()) {
      columns.push({
        key: 'batchId',
        header: this.t('stock.fields.batch'),
        hideBelow: 'xl',
        hideInCards: true,
      });
    }
    columns.push({
      key: 'reason',
      header: this.t('stock.fields.reason'),
      hideBelow: 'xl',
      hideInCards: true,
    });
    return columns;
  });

  protected readonly typeOptions = computed(() => {
    this.language.language();
    return MOVEMENT_TYPES.filter((type) => type !== 'SALE').map((type) => ({
      value: type,
      label: this.t(`stock.movementTypes.${type}`),
    }));
  });
  protected readonly locationOptions = computed(() => this.context.locationOptions());
  protected readonly activeFilters = computed(() => {
    const f = this.list.filters();
    return [f.locationId, f.productId, f.type, f.performedBy, f.dateFrom, f.dateTo].filter(
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
    const params = this.route.snapshot.queryParamMap;
    const productId = params.get('productId');
    const reference = params.get('reference') ?? '';
    if (productId) {
      this.references.product(productId).subscribe({
        next: (product) => this.product.set(product),
        error: () => undefined,
      });
    }
    if (productId || reference) {
      this.list.filters.set({ ...EMPTY_MOVEMENT_FILTERS, productId, reference });
    }
    this.lookups.loadUsers();
    this.list.load();
  }

  protected filter(change: Partial<MovementFilters>): void {
    this.list.applyFilters({ ...this.list.filters(), ...change });
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

  protected signed(movement: StockMovement): number {
    return signedQuantity(movement);
  }

  protected up(movement: StockMovement): boolean {
    return increases(movement.type);
  }

  protected openDocument(movement: StockMovement): void {
    void this.router.navigateByUrl(APP_ROUTES.STOCK.DOCUMENT(movement.documentId));
  }
}
