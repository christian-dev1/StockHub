import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { SafeStorage } from '../../shared/utils/safe-storage';

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'fr';
export const LANGUAGE_STORAGE_KEY = 'stockhub.language';

/** BCP 47 locale used by Intl formatters (dates, numbers, currencies). */
export const LOCALES: Record<Language, string> = { fr: 'fr-FR', en: 'en-US' };

export function isSupportedLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly translate = inject(TranslateService);
  private readonly storage = inject(SafeStorage);
  private readonly document = inject(DOCUMENT);

  readonly language = signal<Language>(DEFAULT_LANGUAGE);

  /** Picks stored language, then browser language, then the default. */
  async init(): Promise<void> {
    const stored = this.storage.get(LANGUAGE_STORAGE_KEY);
    const browser = this.document.defaultView?.navigator.language?.slice(0, 2);
    const initial = isSupportedLanguage(stored)
      ? stored
      : isSupportedLanguage(browser)
        ? browser
        : DEFAULT_LANGUAGE;
    this.translate.setFallbackLang(DEFAULT_LANGUAGE);
    await this.use(initial, false);
  }

  async setLanguage(language: Language): Promise<void> {
    await this.use(language, true);
  }

  locale(): string {
    return LOCALES[this.language()];
  }

  private async use(language: Language, persist: boolean): Promise<void> {
    await firstValueFrom(this.translate.use(language));
    this.language.set(language);
    this.document.documentElement.lang = language;
    if (persist) {
      this.storage.set(LANGUAGE_STORAGE_KEY, language);
    }
  }
}
