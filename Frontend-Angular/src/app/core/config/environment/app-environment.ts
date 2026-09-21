import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  readonly production: boolean;
  /** Relative on purpose: the API is served same-origin (dev proxy / nginx). */
  readonly apiBaseUrl: string;
  readonly actuatorBaseUrl: string;
  readonly defaultLanguage: 'fr' | 'en';
}

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
