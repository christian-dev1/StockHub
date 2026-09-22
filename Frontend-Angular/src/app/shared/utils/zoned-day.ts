/**
 * Calendar days chosen in a date input ("2026-09-22") are days of the company,
 * while the backend filters on instants. These helpers give the first and last
 * instants of such a day in an IANA time zone, daylight saving included.
 */
export function startOfZonedDay(day: string, zone: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const guess = Date.UTC(year, month - 1, date);
  const offset = zoneOffset(new Date(guess), zone);
  const instant = guess - offset;
  // The offset may differ at the resulting instant (DST change around midnight).
  const corrected = zoneOffset(new Date(instant), zone);
  return new Date(corrected === offset ? instant : guess - corrected);
}

export function endOfZonedDay(day: string, zone: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + 1)).toISOString().slice(0, 10);
  return new Date(startOfZonedDay(next, zone).getTime() - 1);
}

/** Today in the given zone, as YYYY-MM-DD. */
export function zonedToday(zone: string, now: Date = new Date()): string {
  const parts = datePartsIn(now, zone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Milliseconds to add to UTC to get the wall-clock time of the zone. */
function zoneOffset(instant: Date, zone: string): number {
  const p = datePartsIn(instant, zone);
  const wallClock = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wallClock - (instant.getTime() - instant.getUTCMilliseconds());
}

function datePartsIn(instant: Date, zone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
