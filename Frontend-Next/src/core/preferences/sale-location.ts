'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { SessionLocation } from '../auth/session';
import { useSession } from '../auth/use-session';

const STORAGE_KEY = 'stockhub.saleLocation';
const listeners = new Set<() => void>();
let memory: string | null = null;

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function write(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage may be unavailable (private mode): the choice then lasts for the page only.
  }
  memory = id;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Personal choice of the point of sale among the locations the user was
 * granted (kept on this device). Defaults to the primary store, then the first
 * store, then any location. The server still checks access on every sale.
 */
export function useSaleLocation(): {
  readonly location: SessionLocation | null;
  readonly locations: readonly SessionLocation[];
  readonly choose: (id: string) => void;
} {
  const { session } = useSession();
  const stored = useSyncExternalStore(
    subscribe,
    () => memory ?? read(),
    () => null,
  );
  const locations = session?.locations ?? [];
  const location =
    locations.find((l) => l.id === stored) ??
    locations.find((l) => l.primary && l.type === 'STORE') ??
    locations.find((l) => l.type === 'STORE') ??
    locations[0] ??
    null;
  const choose = useCallback((id: string) => write(id), []);
  return { location, locations, choose };
}
