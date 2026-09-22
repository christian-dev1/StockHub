import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SkeletonModule } from 'primeng/skeleton';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { DateTimePipe } from '../../../../../shared/pipes/date-time.pipe';
import { QuantityPipe } from '../../../../../shared/pipes/quantity.pipe';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../../../shared/ui/status-badge/status-badge';
import { ResourceState } from '../../../../../shared/utils/resource-state';
import { StockDocument, locationBalances } from '../../../domain/entities/stock';
import { StockDocumentsUseCase } from '../../../domain/use-cases/stock.use-cases';
import { DocumentLines } from '../../components/document-lines';
import { DOCUMENT_TONES } from '../../components/stock-badges';
import { StockLookups } from '../../state/stock-lookups';

/**
 * A stock note with all its lines. There is no PDF yet: the backend does not
 * expose one, so no download action is offered.
 */
@Component({
  selector: 'app-stock-document-page',
  imports: [
    RouterLink,
    TranslatePipe,
    SkeletonModule,
    DateTimePipe,
    QuantityPipe,
    ErrorState,
    PageHeader,
    StatusBadge,
    DocumentLines,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stock-document-page.html',
})
export class StockDocumentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly documents = inject(StockDocumentsUseCase);
  protected readonly lookups = inject(StockLookups);

  protected readonly routes = APP_ROUTES;
  protected readonly tones = DOCUMENT_TONES;
  protected readonly resource = new ResourceState<StockDocument>(inject(DestroyRef));
  protected readonly document = this.resource.data;
  protected readonly balances = computed(() => {
    const document = this.document();
    return document ? locationBalances(document.lines) : [];
  });
  private readonly id = this.route.snapshot.paramMap.get('documentId') ?? '';

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.resource.load(this.documents.get(this.id));
  }
}
