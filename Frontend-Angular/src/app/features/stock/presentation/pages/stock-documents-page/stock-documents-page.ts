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
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { DisplayTimeZone } from '../../../../../core/i18n/time-zone';
import { DateTimePipe } from '../../../../../shared/pipes/date-time.pipe';
import {
  CellTemplate,
  DataTable,
  TableColumn,
} from '../../../../../shared/ui/data-table/data-table';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { StatusBadge } from '../../../../../shared/ui/status-badge/status-badge';
import { PagedList } from '../../../../../shared/utils/paged-list';
import {
  DOCUMENT_TYPES,
  DocumentFilters,
  EMPTY_DOCUMENT_FILTERS,
  StockDocumentSummary,
} from '../../../domain/entities/stock';
import { StockDocumentsUseCase } from '../../../domain/use-cases/stock.use-cases';
import { DOCUMENT_TONES } from '../../components/stock-badges';
import { StockContext } from '../../state/stock-context';
import { StockLookups } from '../../state/stock-lookups';

/** Stock notes: BE (entries), BS (exits), AJ (adjustments), TR (transfers). */
@Component({
  selector: 'app-stock-documents-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    InputTextModule,
    SelectModule,
    DateTimePipe,
    PageHeader,
    DataTable,
    CellTemplate,
    SearchField,
    StatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stock-documents-page.html',
})
export class StockDocumentsPage implements OnInit {
  private readonly documents = inject(StockDocumentsUseCase);
  private readonly timeZone = inject(DisplayTimeZone);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);
  private readonly router = inject(Router);
  protected readonly context = inject(StockContext);
  protected readonly lookups = inject(StockLookups);

  protected readonly routes = APP_ROUTES;
  protected readonly list = new PagedList<StockDocumentSummary, DocumentFilters>(
    (request, filters) => this.documents.search(request, filters, this.timeZone.zone()),
    EMPTY_DOCUMENT_FILTERS,
    inject(DestroyRef),
    { field: 'createdAt', direction: 'desc' },
  );
  protected readonly rowKey = (document: StockDocumentSummary) => document.id;
  protected readonly filtersOpen = signal(false);
  private readonly t = (key: string) => this.translate.instant(key) as string;

  protected readonly columns = computed<TableColumn[]>(() => {
    this.language.language();
    const columns: TableColumn[] = [
      { key: 'number', header: this.t('stock.fields.number'), sortable: true, primary: true },
      { key: 'type', header: this.t('stock.fields.type'), sortable: true },
      { key: 'createdAt', header: this.t('stock.fields.date'), sortable: true },
    ];
    if (this.context.multiLocation()) {
      columns.push({ key: 'locationId', header: this.t('stock.fields.location'), hideBelow: 'lg' });
    }
    columns.push(
      { key: 'performedByName', header: this.t('stock.fields.user'), hideBelow: 'lg' },
      { key: 'reason', header: this.t('stock.fields.reason'), hideBelow: 'xl' },
      { key: 'reference', header: this.t('stock.fields.externalReference'), hideBelow: 'xl' },
    );
    return columns;
  });
  protected readonly typeOptions = computed(() => {
    this.language.language();
    return DOCUMENT_TYPES.map((type) => ({
      value: type,
      label: this.t(`stock.documentTypes.${type}`),
    }));
  });
  protected readonly locationOptions = computed(() => this.context.locationOptions());

  ngOnInit(): void {
    this.list.load();
  }

  protected filter(change: Partial<DocumentFilters>): void {
    this.list.applyFilters({ ...this.list.filters(), ...change });
  }

  protected tone(document: StockDocumentSummary) {
    return DOCUMENT_TONES[document.type];
  }

  protected open(document: StockDocumentSummary): void {
    void this.router.navigateByUrl(APP_ROUTES.STOCK.DOCUMENT(document.id));
  }
}
