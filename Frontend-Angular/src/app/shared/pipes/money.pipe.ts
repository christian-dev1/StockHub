import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth-store';
import { LanguageStore } from '../../core/i18n/language-store';

/**
 * Formats an amount in the company currency and the current language
 * ("1 500 FCFA", "XAF 1,500"). Impure so that it follows language changes.
 */
@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly language = inject(LanguageStore);
  private readonly auth = inject(AuthStore);
  private readonly formatters = new Map<string, Intl.NumberFormat>();

  transform(value: number | null | undefined, currency?: string): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '';
    const code = currency ?? this.auth.company()?.currency ?? 'XAF';
    const locale = this.language.locale();
    const key = `${locale}|${code}`;
    let formatter = this.formatters.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: code });
      this.formatters.set(key, formatter);
    }
    return formatter.format(value);
  }
}
