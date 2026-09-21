import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { EnvironmentProviders, Provider, inject, provideAppInitializer } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { DEFAULT_LANGUAGE, LanguageStore } from './language-store';

/**
 * Angular only ships en-US formatting data; every other locale used by the
 * date / number / currency pipes must be registered (see LOCALES).
 */
registerLocaleData(localeFr, 'fr-FR');

export function provideI18n(): (Provider | EnvironmentProviders)[] {
  return [
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
      fallbackLang: DEFAULT_LANGUAGE,
    }),
    provideAppInitializer(() => inject(LanguageStore).init()),
  ];
}
