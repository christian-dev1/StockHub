import { bucketLabel, labelIndexes, niceScale, wallClock } from './chart';

describe('niceScale', () => {
  it('never returns a zero axis: an empty chart still has ticks', () => {
    expect(niceScale(0)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] });
    expect(niceScale(-5)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] });
  });

  it('rounds the maximum up to a readable step', () => {
    expect(niceScale(7)).toEqual({ max: 8, ticks: [0, 2, 4, 6, 8] });
    expect(niceScale(1000)).toEqual({ max: 1000, ticks: [0, 250, 500, 750, 1000] });
    expect(niceScale(6).ticks.at(-1)).toBe(6);
  });

  it('always covers the requested maximum', () => {
    for (const max of [1, 3, 9, 42, 999, 123_456]) {
      expect(niceScale(max).max).toBeGreaterThanOrEqual(max);
    }
  });
});

describe('wallClock', () => {
  it('parses a bucket as a wall-clock time, never shifted by the browser zone', () => {
    const date = wallClock('2026-09-22T14:30:00');
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(8);
    expect(date.getUTCDate()).toBe(22);
    expect(date.getUTCHours()).toBe(14);
    expect(date.getUTCMinutes()).toBe(30);
  });

  it('defaults a date-only bucket to midnight', () => {
    expect(wallClock('2026-09-22').getUTCHours()).toBe(0);
  });
});

describe('bucketLabel', () => {
  it('formats a day bucket short and long', () => {
    expect(bucketLabel('2026-09-22T00:00:00', 'DAY', 'fr-FR')).toContain('22');
    const long = bucketLabel('2026-09-22T00:00:00', 'DAY', 'fr-FR', true);
    expect(long).toContain('22');
    expect(long).toContain('2026');
  });

  it('formats an hour bucket as a time', () => {
    expect(bucketLabel('2026-09-22T10:43:00', 'HOUR', 'fr-FR')).toMatch(/10/);
  });

  it('follows the requested locale', () => {
    const english = bucketLabel('2026-09-22T00:00:00', 'MONTH', 'en-US', true);
    expect(english).toContain('2026');
    expect(english.toLowerCase()).toContain('september');
  });
});

describe('labelIndexes', () => {
  it('keeps every label when they all fit', () => {
    expect(labelIndexes(5, 10)).toEqual(new Set([0, 1, 2, 3, 4]));
  });

  it('thins the labels down and always keeps the last one', () => {
    const indexes = labelIndexes(30, 7);
    expect(indexes.size).toBeLessThanOrEqual(7);
    expect(indexes.has(29)).toBe(true);
    expect(indexes.has(0)).toBe(false);
  });

  it('handles an empty chart', () => {
    expect(labelIndexes(0, 7)).toEqual(new Set());
  });
});
