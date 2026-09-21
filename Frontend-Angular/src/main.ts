import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  // Bootstrap failed before the Logger exists: this is the only allowed direct console use.
  // eslint-disable-next-line no-console
  console.error('StockHub failed to start', error);
});
