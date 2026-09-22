import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageStore } from '../../core/i18n/language-store';

/**
 * Formats a calendar date sent as "YYYY-MM-DD" (expiry, manufacturing) in the
 * current language. Such dates have no time zone: they are formatted in UTC so
 * that they never move to the previous or next day.
 */
@Pipe({ name: 'calendarDate', pure: false })
export class CalendarDatePipe implements PipeTransform {
  private readonly language = inject(LanguageStore);
  private readonly formatters = new Map<string, Intl.DateTimeFormat>();

  transform(value: string | null | undefined): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const [year, month, day] = value.split('-').map(Number);
    const locale = this.language.locale();
    let formatter = this.formatters.get(locale);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
      this.formatters.set(locale, formatter);
    }
    return formatter.format(new Date(Date.UTC(year, month - 1, day)));
  }
}
