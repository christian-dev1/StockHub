import { EnvironmentProviders, Provider, inject, provideAppInitializer } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { DEFAULT_LANGUAGE, LanguageStore } from './language-store';

export function provideI18n(): (Provider | EnvironmentProviders)[] {
  return [
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
      fallbackLang: DEFAULT_LANGUAGE,
    }),
    provideAppInitializer(() => inject(LanguageStore).init()),
  ];
}
