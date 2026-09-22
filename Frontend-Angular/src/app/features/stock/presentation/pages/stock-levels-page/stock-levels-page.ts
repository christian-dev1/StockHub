import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { DateTimePipe } from '../../../../../shared/pipes/date-time.pipe';
import { QuantityPipe } from '../../../../../shared/pipes/quantity.pipe';
import {
  CellTemplate,
  DataTable,
  TableColumn,
} from '../../../../../shared/ui/data-table/data-table';
import { EmptyState } from '../../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { PagedList } from '../../../../../shared/utils/paged-list';
import {
  EMPTY_LEVEL_FILTERS,
  LevelFilters,
  LevelStateFilter,
  StockLevel,
  StockOperation,
  levelState,
} from '../../../domain/entities/stock';
import { SearchStockLevelsUseCase } from '../../../domain/use-cases/stock.use-cases';
import { OperationLinks } from '../../components/operation-links';
import { LevelStateBadge } from '../../components/stock-badges';
import { StockContext } from '../../state/stock-context';

@Component({
  selector: 'app-stock-levels-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    SelectModule,
    DateTimePipe,
    QuantityPipe,
    PageHeader,
    DataTable,
    CellTemplate,
    SearchField,
    EmptyState,
    LevelStateBadge,
    OperationLinks,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stock-levels-page.html',
})
export class StockLevelsPage implements OnInit {
  private readonly search = inject(SearchStockLevelsUseCase);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);
  protected readonly context = inject(StockContext);
  private readonly route = inject(ActivatedRoute);

  protected readonly routes = APP_ROUTES;
  protected readonly list = new PagedList<StockLevel, LevelFilters>(
    (request, filters) => this.search.execute(request, filters),
    EMPTY_LEVEL_FILTERS,
    inject(DestroyRef),
    { field: 'updatedAt', direction: 'desc' },
  );
  protected readonly rowKey = (level: StockLevel) => level.id;
  protected readonly state = levelState;
  private readonly t = (key: string) => this.translate.instant(key) as string;

  protected readonly columns = computed<TableColumn[]>(() => {
    this.language.language();
    const columns: TableColumn[] = [
      { key: 'productName', header: this.t('stock.fields.product'), primary: true },
      { key: 'sku', header: this.t('stock.fields.sku'), hideBelow: 'lg', hideInCards: true },
    ];
    if (this.context.multiLocation()) {
      columns.push({ key: 'locationId', header: this.t('stock.fields.location') });
    }
    columns.push(
      {
        key: 'quantity',
        header: this.t('stock.fields.quantity'),
        sortable: true,
        align: 'end',
      },
      {
        key: 'minStock',
        header: this.t('stock.fields.minStock'),
        align: 'end',
        hideBelow: 'lg',
      },
      { key: 'state', header: this.t('stock.fields.state') },
      {
        key: 'updatedAt',
        header: this.t('stock.fields.updatedAt'),
        sortable: true,
        hideBelow: 'xl',
      },
    );
    if (this.rowOperations().length > 0) {
      columns.push({ key: 'actions', header: this.t('stock.fields.actions'), align: 'end' });
    }
    return columns;
  });

  protected readonly stateOptions = computed(() => {
    this.language.language();
    return [
      { value: 'LOW', label: this.t('stock.filters.lowStock') },
      { value: 'OUT', label: this.t('stock.filters.outOfStock') },
    ];
  });
  protected readonly locationOptions = computed(() => this.context.locationOptions());
  /** Quick actions offered on each row. */
  protected readonly rowOperations = computed(() =>
    this.context
      .operations()
      .filter((op): op is 'entry' | 'exit' => op === 'entry' || op === 'exit'),
  );
  protected readonly firstOperation = computed<StockOperation | null>(() =>
    this.context.can('entry') ? 'entry' : null,
  );

  ngOnInit(): void {
    // Dashboard links open the list on a state: ?state=LOW or ?state=OUT.
    const state = this.route.snapshot.queryParamMap.get('state');
    if (state === 'LOW' || state === 'OUT') {
      this.list.filters.set({ ...EMPTY_LEVEL_FILTERS, state });
    }
    this.list.load();
  }

  protected filter(change: Partial<LevelFilters>): void {
    this.list.applyFilters({ ...this.list.filters(), ...change });
  }

  protected setState(state: LevelStateFilter): void {
    this.filter({ state: this.list.filters().state === state ? null : state });
  }

  protected locationName(id: string): string {
    return this.context.locations().find((l) => l.id === id)?.name ?? '—';
  }

  protected operationRoute(operation: 'entry' | 'exit'): string {
    return operation === 'entry' ? APP_ROUTES.STOCK.ENTRY : APP_ROUTES.STOCK.EXIT;
  }
}
