import { DatePipe } from '@angular/common';
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
import { AuthStore } from '../../../../../core/auth/auth-store';
import { RoleCode } from '../../../../../core/config/permissions/permissions';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import {
  CellTemplate,
  DataTable,
  TableColumn,
} from '../../../../../shared/ui/data-table/data-table';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { PagedList } from '../../../../../shared/utils/paged-list';
import { User, UserFilters, UserStatus } from '../../../domain/entities/user';
import { SearchUsersUseCase } from '../../../domain/use-cases/user.use-cases';
import { RoleBadge, UserStatusBadge } from '../../components/user-badges';

@Component({
  selector: 'app-users-list-page',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    TranslatePipe,
    SelectModule,
    PageHeader,
    DataTable,
    CellTemplate,
    SearchField,
    RoleBadge,
    UserStatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-list-page.html',
})
export class UsersListPage implements OnInit {
  private readonly search = inject(SearchUsersUseCase);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  protected readonly auth = inject(AuthStore);
  protected readonly language = inject(LanguageStore);

  protected readonly routes = APP_ROUTES;
  protected readonly list = new PagedList<User, UserFilters>(
    (request, filters) => this.search.execute(request, filters),
    { text: '', role: null, status: null },
    inject(DestroyRef),
    { field: 'lastName', direction: 'asc' },
  );
  protected readonly rowKey = (user: User) => user.id;

  private readonly t = (key: string) => this.translate.instant(key) as string;

  protected readonly columns = computed<TableColumn[]>(() => {
    this.language.language();
    return [
      { key: 'lastName', header: this.t('users.fields.name'), sortable: true, primary: true },
      { key: 'email', header: this.t('users.fields.email'), sortable: true, hideBelow: 'lg' },
      { key: 'role', header: this.t('users.fields.role'), sortable: true },
      { key: 'status', header: this.t('users.fields.status'), sortable: true },
      {
        key: 'lastLoginAt',
        header: this.t('users.fields.lastLogin'),
        sortable: true,
        hideBelow: 'xl',
      },
    ];
  });

  protected readonly roleOptions = computed(() => {
    this.language.language();
    return (['ADMIN', 'MANAGER', 'MAGASINIER', 'VENDEUR'] as RoleCode[]).map((value) => ({
      value,
      label: this.t(`roles.${value}`),
    }));
  });
  protected readonly statusOptions = computed(() => {
    this.language.language();
    return (['ACTIVE', 'DISABLED'] as UserStatus[]).map((value) => ({
      value,
      label: this.t(`users.status.${value}`),
    }));
  });

  ngOnInit(): void {
    this.list.load();
  }

  protected filter(change: Partial<UserFilters>): void {
    this.list.applyFilters({ ...this.list.filters(), ...change });
  }

  protected open(user: User): void {
    void this.router.navigateByUrl(APP_ROUTES.USERS.DETAIL(user.id));
  }
}
