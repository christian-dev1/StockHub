import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import {
  CellTemplate,
  DataTable,
  TableColumn,
} from '../../../../../shared/ui/data-table/data-table';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { ActiveBadge } from '../../../../../shared/ui/status-badge/active-badge';
import { PagedList } from '../../../../../shared/utils/paged-list';
import { Supplier, SupplierFilters } from '../../../domain/entities/supplier';
import { SearchSuppliersUseCase } from '../../../domain/use-cases/supplier.use-cases';

@Component({
  selector: 'app-suppliers-list-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    SelectModule,
    PageHeader,
    DataTable,
    CellTemplate,
    SearchField,
    ActiveBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './suppliers-list-page.html',
})
export class SuppliersListPage implements OnInit {
  private readonly search = inject(SearchSuppliersUseCase);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);
  protected readonly auth = inject(AuthStore);

  protected readonly routes = APP_ROUTES;
  protected readonly list = new PagedList<Supplier, SupplierFilters>(
    (request, filters) => this.search.execute(request, filters),
    { text: '', active: null },
    inject(DestroyRef),
    { field: 'name', direction: 'asc' },
  );
  protected readonly rowKey = (supplier: Supplier) => supplier.id;
  private readonly t = (key: string) => this.translate.instant(key) as string;

  protected readonly columns = computed<TableColumn[]>(() => {
    this.language.language();
    return [
      { key: 'name', header: this.t('suppliers.fields.name'), sortable: true, primary: true },
      { key: 'code', header: this.t('suppliers.fields.code'), sortable: true },
      { key: 'email', header: this.t('suppliers.fields.email'), hideBelow: 'lg' },
      { key: 'phone', header: this.t('suppliers.fields.phone'), hideBelow: 'xl' },
      {
        key: 'leadTimeDays',
        header: this.t('suppliers.fields.leadTimeDays'),
        sortable: true,
        align: 'end',
      },
      { key: 'active', header: this.t('suppliers.fields.status') },
    ];
  });

  protected readonly statusOptions = computed(() => {
    this.language.language();
    return [
      { value: true, label: this.t('common.status.active') },
      { value: false, label: this.t('common.status.inactive') },
    ];
  });

  ngOnInit(): void {
    this.list.load();
  }

  protected filter(change: Partial<SupplierFilters>): void {
    this.list.applyFilters({ ...this.list.filters(), ...change });
  }

  protected open(supplier: Supplier): void {
    void this.router.navigateByUrl(APP_ROUTES.SUPPLIERS.DETAIL(supplier.id));
  }
}
