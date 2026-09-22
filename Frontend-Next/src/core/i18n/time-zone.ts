/**
 * Display time zone policy: dates are stored as UTC instants by the backend
 * and shown in the company's time zone. Before sign-in (or if the company zone
 * is invalid) the browser zone is used, then UTC as a last resort.
 */
export const FALLBACK_TIME_ZONE = 'UTC';

export function isValidTimeZone(zone: string | null | undefined): zone is string {
  if (!zone) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function resolveTimeZone(
  companyZone: string | null | undefined,
  browserZone: string | null | undefined,
): string {
  if (isValidTimeZone(companyZone)) {
    return companyZone;
  }
  return isValidTimeZone(browserZone) ? browserZone : FALLBACK_TIME_ZONE;
}
