import { Pipe, PipeTransform, inject } from '@angular/core';
import { DisplayTimeZone } from '../../core/i18n/time-zone';
import { LanguageStore } from '../../core/i18n/language-store';

export type DateTimeStyle = 'short' | 'medium' | 'time';

const STYLES: Record<DateTimeStyle, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: 'short', timeStyle: 'short' },
  medium: { dateStyle: 'medium', timeStyle: 'short' },
  time: { timeStyle: 'medium' },
};

/**
 * Formats an instant in the display time zone and the current language.
 * Replaces Angular's DatePipe, which does not accept IANA zone names.
 * Impure so that it follows language and session changes (signals).
 */
@Pipe({ name: 'dateTime', pure: false })
export class DateTimePipe implements PipeTransform {
  private readonly language = inject(LanguageStore);
  private readonly timeZone = inject(DisplayTimeZone);
  private readonly formatters = new Map<string, Intl.DateTimeFormat>();

  transform(value: string | Date | null | undefined, style: DateTimeStyle = 'medium'): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return this.formatter(this.language.locale(), this.timeZone.zone(), style).format(date);
  }

  private formatter(locale: string, zone: string, style: DateTimeStyle): Intl.DateTimeFormat {
    const key = `${locale}|${zone}|${style}`;
    let formatter = this.formatters.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale, { ...STYLES[style], timeZone: zone });
      this.formatters.set(key, formatter);
    }
    return formatter;
  }
}
