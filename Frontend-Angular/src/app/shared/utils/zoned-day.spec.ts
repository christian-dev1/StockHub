import { endOfZonedDay, startOfZonedDay, zonedToday } from './zoned-day';

describe('zoned days', () => {
  it('starts a Douala day at 23:00 UTC the day before', () => {
    expect(startOfZonedDay('2026-09-22', 'Africa/Douala').toISOString()).toBe(
      '2026-09-21T23:00:00.000Z',
    );
    expect(endOfZonedDay('2026-09-22', 'Africa/Douala').toISOString()).toBe(
      '2026-09-22T22:59:59.999Z',
    );
  });

  it('follows daylight saving time', () => {
    expect(startOfZonedDay('2026-07-01', 'Europe/Paris').toISOString()).toBe(
      '2026-06-30T22:00:00.000Z',
    );
    expect(startOfZonedDay('2026-12-01', 'Europe/Paris').toISOString()).toBe(
      '2026-11-30T23:00:00.000Z',
    );
    // 29 March 2026: clocks go forward at 02:00, the day lasts 23 hours.
    expect(endOfZonedDay('2026-03-29', 'Europe/Paris').toISOString()).toBe(
      '2026-03-29T21:59:59.999Z',
    );
  });

  it('keeps UTC days unchanged', () => {
    expect(startOfZonedDay('2026-01-31', 'UTC').toISOString()).toBe('2026-01-31T00:00:00.000Z');
    expect(endOfZonedDay('2026-12-31', 'UTC').toISOString()).toBe('2026-12-31T23:59:59.999Z');
  });

  it('gives today in the zone, not in the browser', () => {
    const lateEvening = new Date('2026-09-22T23:30:00Z');
    expect(zonedToday('Africa/Douala', lateEvening)).toBe('2026-09-23');
    expect(zonedToday('America/New_York', lateEvening)).toBe('2026-09-22');
  });
});
