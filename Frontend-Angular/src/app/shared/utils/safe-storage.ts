import { Injectable } from '@angular/core';

/**
 * localStorage wrapper that never throws (private mode, blocked storage, SSR).
 * Only used for per-device conveniences such as theme and language.
 */
@Injectable({ providedIn: 'root' })
export class SafeStorage {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Storage unavailable: the preference simply won't persist.
    }
  }

  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore
    }
  }
}
