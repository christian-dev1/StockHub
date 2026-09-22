import { Injectable, computed, inject } from '@angular/core';
import { AuthStore } from '../auth/auth-store';

/**
 * Display time zone policy: the backend stores UTC instants; the UI shows them
 * in the company's time zone. Before sign-in, or for the platform super admin
 * (no company), the browser zone is used, then UTC as a last resort.
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

@Injectable({ providedIn: 'root' })
export class DisplayTimeZone {
  private readonly auth = inject(AuthStore);
  private readonly browserZone = browserTimeZone();

  readonly zone = computed(() => resolveTimeZone(this.auth.company()?.timezone, this.browserZone));
}
