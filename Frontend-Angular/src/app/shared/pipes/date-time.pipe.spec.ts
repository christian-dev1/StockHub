import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DisplayTimeZone } from '../../core/i18n/time-zone';
import { LanguageStore } from '../../core/i18n/language-store';
import { DateTimePipe } from './date-time.pipe';

describe('DateTimePipe', () => {
  const zone = signal('Africa/Douala');
  let pipe: DateTimePipe;

  beforeEach(() => {
    zone.set('Africa/Douala');
    TestBed.configureTestingModule({
      providers: [
        DateTimePipe,
        { provide: LanguageStore, useValue: { locale: () => 'fr-FR' } },
        { provide: DisplayTimeZone, useValue: { zone } },
      ],
    });
    pipe = TestBed.inject(DateTimePipe);
  });

  it('renders the instant in the company time zone', () => {
    expect(pipe.transform('2026-09-21T23:30:00Z', 'time')).toBe('00:30:00');
  });

  it('follows a change of time zone', () => {
    zone.set('Asia/Tokyo');
    expect(pipe.transform('2026-09-21T23:30:00Z', 'time')).toBe('08:30:00');
  });

  it('ignores empty and invalid values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('not a date')).toBe('');
  });
});
