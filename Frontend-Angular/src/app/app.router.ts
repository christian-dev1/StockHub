import { Routes } from '@angular/router';
import { APP_PATHS } from './core/config/routes/app.routes';
import { Shell } from './core/layout/shell/shell';
import { DASHBOARD_PROVIDERS } from './features/dashboard/dashboard.providers';
import { ErrorStatusPage } from './shared/pages/error-status/error-status-page';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
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
