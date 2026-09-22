import { describe, expect, it } from 'vitest';
import { FALLBACK_TIME_ZONE, isValidTimeZone, resolveTimeZone } from './time-zone';

describe('resolveTimeZone', () => {
  it('prefers the company time zone', () => {
    expect(resolveTimeZone('Africa/Douala', 'Europe/Paris')).toBe('Africa/Douala');
  });

  it('falls back to the browser zone when the company has none or an invalid one', () => {
    expect(resolveTimeZone(null, 'Europe/Paris')).toBe('Europe/Paris');
    expect(resolveTimeZone('Mars/Olympus', 'Europe/Paris')).toBe('Europe/Paris');
  });

  it('ends with UTC when nothing usable is known', () => {
    expect(resolveTimeZone(undefined, undefined)).toBe(FALLBACK_TIME_ZONE);
    expect(resolveTimeZone('', 'Nowhere/Land')).toBe(FALLBACK_TIME_ZONE);
  });

  it('validates IANA names through Intl', () => {
    expect(isValidTimeZone('America/New_York')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
  });
});
