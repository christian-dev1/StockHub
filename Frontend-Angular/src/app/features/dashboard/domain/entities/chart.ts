import { Granularity } from './dashboard';

/**
 * Pure chart geometry, kept apart from the components so that it is unit
 * tested: scales with round ticks, bucket labels and the label thinning that
 * keeps a 30-bar chart readable on a phone.
 */

/** Rounded maximum and ticks for a value axis starting at zero. */
export function niceScale(max: number, tickCount = 4): { max: number; ticks: number[] } {
  if (max <= 0)
    return { max: tickCount, ticks: Array.from({ length: tickCount + 1 }, (_, i) => i) };
  const rough = max / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((candidate) => candidate >= rough) ??
    10 * magnitude;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= niceMax + step / 2; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return { max: niceMax, ticks };
}

/** Parses "2026-09-22T14:00:00" as a wall-clock time, never shifted by the browser zone. */
export function wallClock(bucket: string): Date {
  const [date, time = '00:00:00'] = bucket.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

const LABEL_FORMATS: Record<Granularity, Intl.DateTimeFormatOptions> = {
  HOUR: { hour: '2-digit', minute: '2-digit' },
  DAY: { day: 'numeric', month: 'short' },
  WEEK: { day: 'numeric', month: 'short' },
  MONTH: { month: 'short', year: '2-digit' },
};

const LONG_FORMATS: Record<Granularity, Intl.DateTimeFormatOptions> = {
  HOUR: { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
  DAY: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  WEEK: { day: 'numeric', month: 'long', year: 'numeric' },
  MONTH: { month: 'long', year: 'numeric' },
};

export function bucketLabel(
  bucket: string,
  granularity: Granularity,
  locale: string,
  long = false,
): string {
  const options = (long ? LONG_FORMATS : LABEL_FORMATS)[granularity];
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(wallClock(bucket));
}

/** Indexes of the axis labels to show so that at most `maxLabels` fit, last one included. */
export function labelIndexes(count: number, maxLabels: number): Set<number> {
  if (count <= maxLabels) return new Set(Array.from({ length: count }, (_, i) => i));
  const step = Math.ceil(count / maxLabels);
  const indexes = new Set<number>();
  for (let i = count - 1; i >= 0; i -= step) indexes.add(i);
  return indexes;
}
