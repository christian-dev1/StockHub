import { formatDate } from '@angular/common';
import { LOCALES } from './language-store';
import './i18n.providers';

describe('locale data', () => {
  it('formats dates in every supported locale', () => {
    const date = new Date(2026, 8, 21, 14, 5);
    for (const locale of Object.values(LOCALES)) {
      expect(() => formatDate(date, 'medium', locale)).not.toThrow();
    }
    expect(formatDate(date, 'longDate', LOCALES.fr)).toBe('21 septembre 2026');
  });
});
