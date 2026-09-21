import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { environment } from '../environments/environment';
import { routes } from './app.router';
import { APP_ENVIRONMENT } from './core/config/environment/app-environment';
import { StockHubPreset } from './core/config/theme/stockhub-preset';
import { GlobalErrorHandler } from './core/errors/global-error-handler';
import { provideI18n } from './core/i18n/i18n.providers';
import { acceptLanguageInterceptor } from './core/interceptors/accept-language.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    { provide: APP_ENVIRONMENT, useValue: environment },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([acceptLanguageInterceptor])),
    providePrimeNG({
      theme: {
        preset: StockHubPreset,
        options: {
          darkModeSelector: '.dark',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
        },
      },
    }),
    MessageService,
    ConfirmationService,
    ...provideI18n(),
  ],
};
