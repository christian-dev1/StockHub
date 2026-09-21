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
import { SelectModule } from 'primeng/select';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import {
  DataTable,
  CellTemplate,
  TableColumn,
} from '../../../../../shared/ui/data-table/data-table';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { PagedList } from '../../../../../shared/utils/paged-list';
import { Company, CompanyFilters, CompanyStatus } from '../../../domain/entities/company';
import { SearchCompaniesUseCase } from '../../../domain/use-cases/company.use-cases';
import { CompanyStatusBadge } from '../../components/company-status-badge';

@Component({
  selector: 'app-companies-list-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    SelectModule,
    PageHeader,
    DataTable,
    CellTemplate,
    SearchField,
    CompanyStatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './companies-list-page.html',
})
export class CompaniesListPage implements OnInit {
  private readonly search = inject(SearchCompaniesUseCase);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);

  protected readonly routes = APP_ROUTES;
  protected readonly list = new PagedList<Company, CompanyFilters>(
    (request, filters) => this.search.execute(request, filters),
    { text: '', status: null },
    inject(DestroyRef),
    { field: 'name', direction: 'asc' },
  );
  protected readonly rowKey = (company: Company) => company.id;

  protected readonly columns = computed<TableColumn[]>(() => {
    this.language.language();
    const t = (key: string) => this.translate.instant(key) as string;
    return [
      { key: 'name', header: t('companies.fields.name'), sortable: true, primary: true },
      { key: 'city', header: t('companies.fields.city'), hideBelow: 'lg' },
      { key: 'currency', header: t('companies.fields.currency'), hideBelow: 'lg' },
      { key: 'email', header: t('companies.fields.email'), hideBelow: 'xl' },
      { key: 'status', header: t('companies.fields.status'), sortable: true },
    ];
  });

  protected readonly statusOptions = computed(() => {
    this.language.language();
    return (['ACTIVE', 'DISABLED'] as CompanyStatus[]).map((value) => ({
      value,
      label: this.translate.instant(`companies.status.${value}`) as string,
    }));
  });

  ngOnInit(): void {
    this.list.load();
  }

  protected onSearch(text: string): void {
    this.list.applyFilters({ ...this.list.filters(), text });
  }

  protected onStatus(status: CompanyStatus | null): void {
    this.list.applyFilters({ ...this.list.filters(), status });
  }

  protected open(company: Company): void {
    void this.router.navigateByUrl(APP_ROUTES.PLATFORM.COMPANY_DETAIL(company.id));
  }
}
