import { FALLBACK_TIME_ZONE, isValidTimeZone, resolveTimeZone } from './time-zone';

describe('resolveTimeZone', () => {
  it('prefers the company time zone', () => {
    expect(resolveTimeZone('Africa/Douala', 'Europe/Paris')).toBe('Africa/Douala');
  });

  it('falls back to the browser zone, then UTC', () => {
    expect(resolveTimeZone(null, 'Europe/Paris')).toBe('Europe/Paris');
    expect(resolveTimeZone('Mars/Olympus', 'Europe/Paris')).toBe('Europe/Paris');
    expect(resolveTimeZone(undefined, 'Nowhere/Land')).toBe(FALLBACK_TIME_ZONE);
  });

  it('validates IANA names through Intl', () => {
    expect(isValidTimeZone('America/New_York')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
  });
});
