import { Routes } from '@angular/router';
import { APP_PATHS } from './core/config/routes/app.routes';
import {
  authGuard,
  companyGuard,
  guestGuard,
  passwordChangeGuard,
  permissionGuard,
  platformGuard,
} from './core/guards/auth.guards';
import { BARCODES_PROVIDERS } from './features/barcodes/barcodes.providers';
import { CATEGORIES_PROVIDERS } from './features/categories/categories.providers';
import { COMPANIES_PROVIDERS } from './features/companies/companies.providers';
import { DASHBOARD_PROVIDERS } from './features/dashboard/dashboard.providers';
import { LOCATIONS_PROVIDERS } from './features/locations/locations.providers';
import { PRODUCTS_PROVIDERS } from './features/products/products.providers';
import { STOCK_PROVIDERS } from './features/stock/stock.providers';
import { SETTINGS_PROVIDERS } from './features/settings/settings.providers';
import { SUPPLIERS_PROVIDERS } from './features/suppliers/suppliers.providers';
import { USERS_PROVIDERS } from './features/users/users.providers';
import { ErrorStatusPage } from './shared/pages/error-status/error-status-page';

export const routes: Routes = [
  {
    path: APP_PATHS.LOGIN,
    canActivate: [guestGuard],
    title: 'StockHub',
    loadComponent: () =>
      import('./features/auth/presentation/pages/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: APP_PATHS.CHANGE_PASSWORD,
    canActivate: [passwordChangeGuard],
    title: 'StockHub',
    loadComponent: () =>
      import('./features/auth/presentation/pages/change-password-page/change-password-page').then(
        (m) => m.ChangePasswordPage,
      ),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: APP_PATHS.DASHBOARD },
      {
        path: APP_PATHS.DASHBOARD,
        title: 'StockHub',
        providers: DASHBOARD_PROVIDERS,
        loadComponent: () =>
          import('./features/dashboard/presentation/pages/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: `${APP_PATHS.PLATFORM.ROOT}/${APP_PATHS.PLATFORM.COMPANIES}`,
        canActivate: [platformGuard, permissionGuard],
        data: { permissions: ['COMPANY_VIEW'] },
        providers: COMPANIES_PROVIDERS,
        children: [
          {
            path: '',
            title: 'StockHub',
            loadComponent: () =>
              import('./features/companies/presentation/pages/companies-list-page/companies-list-page').then(
                (m) => m.CompaniesListPage,
              ),
          },
          {
            path: APP_PATHS.PLATFORM.CREATE,
            canActivate: [permissionGuard],
            data: { permissions: ['COMPANY_CREATE'] },
            loadComponent: () =>
              import('./features/companies/presentation/pages/company-create-page/company-create-page').then(
                (m) => m.CompanyCreatePage,
              ),
          },
          {
            path: APP_PATHS.PLATFORM.DETAIL,
            loadComponent: () =>
              import('./features/companies/presentation/pages/company-detail-page/company-detail-page').then(
                (m) => m.CompanyDetailPage,
              ),
          },
        ],
      },
      {
        path: APP_PATHS.USERS.ROOT,
        canActivate: [companyGuard, permissionGuard],
        data: { permissions: ['USER_VIEW'] },
        providers: USERS_PROVIDERS,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/users/presentation/pages/users-list-page/users-list-page').then(
                (m) => m.UsersListPage,
              ),
          },
          {
            path: APP_PATHS.USERS.CREATE,
            canActivate: [permissionGuard],
            data: { permissions: ['USER_CREATE'] },
            loadComponent: () =>
              import('./features/users/presentation/pages/user-create-page/user-create-page').then(
                (m) => m.UserCreatePage,
              ),
          },
          {
            path: APP_PATHS.USERS.DETAIL,
            loadComponent: () =>
              import('./features/users/presentation/pages/user-detail-page/user-detail-page').then(
                (m) => m.UserDetailPage,
              ),
          },
        ],
      },
      {
        path: APP_PATHS.PRODUCTS.ROOT,
        canActivate: [companyGuard, permissionGuard],
        data: { permissions: ['PRODUCT_VIEW'] },
        providers: [...PRODUCTS_PROVIDERS, ...BARCODES_PROVIDERS],
        children: [
          {
            path: '',
            title: 'StockHub',
            loadComponent: () =>
              import('./features/products/presentation/pages/products-list-page/products-list-page').then(
                (m) => m.ProductsListPage,
              ),
          },
          {
            path: APP_PATHS.PRODUCTS.CREATE,
            canActivate: [permissionGuard],
            data: { permissions: ['PRODUCT_CREATE'] },
            loadComponent: () =>
              import('./features/products/presentation/pages/product-create-page/product-create-page').then(
                (m) => m.ProductCreatePage,
              ),
          },
          {
            path: APP_PATHS.PRODUCTS.IMPORT,
            canActivate: [permissionGuard],
            data: { permissions: ['PRODUCT_IMPORT'] },
            loadComponent: () =>
              import('./features/products/presentation/pages/product-import-page/product-import-page').then(
                (m) => m.ProductImportPage,
              ),
          },
          {
            path: APP_PATHS.PRODUCTS.LABELS,
            canActivate: [permissionGuard],
            data: { permissions: ['BARCODE_PRINT'] },
            loadComponent: () =>
              import('./features/barcodes/presentation/pages/labels-page/labels-page').then(
                (m) => m.LabelsPage,
              ),
          },
          {
            path: APP_PATHS.PRODUCTS.DETAIL,
            loadComponent: () =>
              import('./features/products/presentation/pages/product-detail-page/product-detail-page').then(
                (m) => m.ProductDetailPage,
              ),
          },
        ],
      },
      {
        path: APP_PATHS.STOCK.ROOT,
        canActivate: [companyGuard, permissionGuard],
        data: { permissions: ['STOCK_VIEW'] },
        providers: STOCK_PROVIDERS,
        children: [
          {
            path: '',
            title: 'StockHub',
            loadComponent: () =>
              import('./features/stock/presentation/pages/stock-levels-page/stock-levels-page').then(
                (m) => m.StockLevelsPage,
              ),
          },
          {
            path: APP_PATHS.STOCK.ENTRY,
            canActivate: [permissionGuard],
            data: { permissions: ['STOCK_ENTRY'], operation: 'entry' },
            loadComponent: () =>
              import('./features/stock/presentation/pages/stock-operation-page/stock-operation-page').then(
                (m) => m.StockOperationPage,
              ),
          },
          {
            path: APP_PATHS.STOCK.EXIT,
            canActivate: [permissionGuard],
            data: { permissions: ['STOCK_EXIT'], operation: 'exit' },
            loadComponent: () =>
              import('./features/stock/presentation/pages/stock-operation-page/stock-operation-page').then(
                (m) => m.StockOperationPage,
              ),
          },
          {
            path: APP_PATHS.STOCK.ADJUSTMENT,
            canActivate: [permissionGuard],
            data: { permissions: ['STOCK_ADJUST'], operation: 'adjustment' },
            loadComponent: () =>
              import('./features/stock/presentation/pages/stock-operation-page/stock-operation-page').then(
                (m) => m.StockOperationPage,
              ),
          },
          {
            path: APP_PATHS.STOCK.TRANSFER,
            canActivate: [permissionGuard],
            data: { permissions: ['STOCK_TRANSFER'], operation: 'transfer' },
            loadComponent: () =>
              import('./features/stock/presentation/pages/stock-operation-page/stock-operation-page').then(
                (m) => m.StockOperationPage,
              ),
          },
          {
            path: APP_PATHS.STOCK.MOVEMENTS,
            loadComponent: () =>
              import('./features/stock/presentation/pages/stock-movements-page/stock-movements-page').then(
                (m) => m.StockMovementsPage,
              ),
          },
          {
            path: APP_PATHS.STOCK.BATCHES,
            canActivate: [permissionGuard],
            data: { permissions: ['BATCH_MANAGE'] },
            loadComponent: () =>
              import('./features/stock/presentation/pages/batches-page/batches-page').then(
                (m) => m.BatchesPage,
              ),
          },
          {
            path: APP_PATHS.STOCK.DOCUMENTS,
            loadComponent: () =>
              import('./features/stock/presentation/pages/stock-documents-page/stock-documents-page').then(
                (m) => m.StockDocumentsPage,
              ),
          },
          {
            path: APP_PATHS.STOCK.DOCUMENT,
            loadComponent: () =>
              import('./features/stock/presentation/pages/stock-document-page/stock-document-page').then(
                (m) => m.StockDocumentPage,
              ),
          },
        ],
      },
      {
        path: APP_PATHS.CATEGORIES.ROOT,
        canActivate: [companyGuard, permissionGuard],
        data: { permissions: ['CATEGORY_VIEW'] },
        providers: CATEGORIES_PROVIDERS,
        title: 'StockHub',
        loadComponent: () =>
          import('./features/categories/presentation/pages/categories-page/categories-page').then(
            (m) => m.CategoriesPage,
          ),
      },
      {
        path: APP_PATHS.SUPPLIERS.ROOT,
        canActivate: [companyGuard, permissionGuard],
        data: { permissions: ['SUPPLIER_VIEW'] },
        providers: SUPPLIERS_PROVIDERS,
        children: [
          {
            path: '',
            title: 'StockHub',
            loadComponent: () =>
              import('./features/suppliers/presentation/pages/suppliers-list-page/suppliers-list-page').then(
                (m) => m.SuppliersListPage,
              ),
          },
          {
            path: APP_PATHS.SUPPLIERS.CREATE,
            canActivate: [permissionGuard],
            data: { permissions: ['SUPPLIER_CREATE'] },
            loadComponent: () =>
              import('./features/suppliers/presentation/pages/supplier-create-page/supplier-create-page').then(
                (m) => m.SupplierCreatePage,
              ),
          },
          {
            path: APP_PATHS.SUPPLIERS.DETAIL,
            loadComponent: () =>
              import('./features/suppliers/presentation/pages/supplier-detail-page/supplier-detail-page').then(
                (m) => m.SupplierDetailPage,
              ),
          },
        ],
      },
      {
        path: APP_PATHS.LOCATIONS.ROOT,
        canActivate: [companyGuard, permissionGuard],
        data: { permissions: ['WAREHOUSE_VIEW'] },
        providers: LOCATIONS_PROVIDERS,
        children: [
          {
            path: '',
            title: 'StockHub',
            loadComponent: () =>
              import('./features/locations/presentation/pages/locations-list-page/locations-list-page').then(
                (m) => m.LocationsListPage,
              ),
          },
          {
            path: APP_PATHS.LOCATIONS.CREATE,
            canActivate: [permissionGuard],
            data: { permissions: ['WAREHOUSE_CREATE'] },
            loadComponent: () =>
              import('./features/locations/presentation/pages/location-form-page/location-form-page').then(
                (m) => m.LocationFormPage,
              ),
          },
          {
            path: APP_PATHS.LOCATIONS.EDIT,
            canActivate: [permissionGuard],
            data: { permissions: ['WAREHOUSE_UPDATE'] },
            loadComponent: () =>
              import('./features/locations/presentation/pages/location-form-page/location-form-page').then(
                (m) => m.LocationFormPage,
              ),
          },
        ],
      },
      {
        path: `${APP_PATHS.SETTINGS.ROOT}/${APP_PATHS.SETTINGS.COMPANY}`,
        canActivate: [companyGuard, permissionGuard],
        data: { permissions: ['COMPANY_VIEW'] },
        providers: SETTINGS_PROVIDERS,
        loadComponent: () =>
          import('./features/settings/presentation/pages/company-settings-page/company-settings-page').then(
            (m) => m.CompanySettingsPage,
          ),
      },
    ],
  },
  {
    path: APP_PATHS.FORBIDDEN,
    component: ErrorStatusPage,
    data: { status: 403 },
    title: 'StockHub — 403',
  },
  {
    path: APP_PATHS.SERVER_ERROR,
    component: ErrorStatusPage,
    data: { status: 500 },
    title: 'StockHub — 500',
  },
  { path: '**', component: ErrorStatusPage, data: { status: 404 }, title: 'StockHub — 404' },
];
