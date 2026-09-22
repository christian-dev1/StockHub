import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageStore } from '../../core/i18n/language-store';

/**
 * Formats a stock quantity in the current language, with up to three decimals
 * ("1 250,5"). `signed` prefixes positive values with "+" for movements.
 * Impure so that it follows language changes.
 */
@Pipe({ name: 'quantity', pure: false })
export class QuantityPipe implements PipeTransform {
  private readonly language = inject(LanguageStore);
  private readonly formatters = new Map<string, Intl.NumberFormat>();

  transform(value: number | null | undefined, signed = false): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '';
    const locale = this.language.locale();
    const key = `${locale}|${signed}`;
    let formatter = this.formatters.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 3,
        signDisplay: signed ? 'exceptZero' : 'auto',
      });
      this.formatters.set(key, formatter);
    }
    return formatter.format(value);
  }
}
