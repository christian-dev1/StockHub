'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useSession } from '@/core/auth/use-session';
import {
  addProduct,
  refreshProducts,
  removeLine,
  setQuantity,
  stepQuantity,
  type CartLine,
  type CartProduct,
} from '../../domain/entities/cart';

const EMPTY: readonly CartLine[] = [];
const listeners = new Set<() => void>();
const carts = new Map<string, readonly CartLine[]>();

/**
 * Cart of the point of sale, kept per user in sessionStorage: it survives a
 * page change or a reload in the same tab, and disappears with the tab.
 */
function storageKey(userId: string) {
  return `stockhub.cart.${userId}`;
}

function load(userId: string): readonly CartLine[] {
  const cached = carts.get(userId);
  if (cached) return cached;
  let lines: readonly CartLine[] = EMPTY;
  try {
    const raw = window.sessionStorage.getItem(storageKey(userId));
    if (raw) lines = JSON.parse(raw) as CartLine[];
  } catch {
    lines = EMPTY;
  }
  carts.set(userId, lines);
  return lines;
}

function save(userId: string, lines: readonly CartLine[]) {
  carts.set(userId, lines);
  try {
    if (lines.length) window.sessionStorage.setItem(storageKey(userId), JSON.stringify(lines));
    else window.sessionStorage.removeItem(storageKey(userId));
  } catch {
    // The cart then only lives in memory.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  const { session } = useSession();
  const userId = session?.id ?? 'anonymous';
  const lines = useSyncExternalStore(
    subscribe,
    () => load(userId),
    () => EMPTY,
  );
  return useMemo(() => {
    const update = (next: readonly CartLine[]) => save(userId, next);
    return {
      lines,
      add: (product: CartProduct) => update(addProduct(load(userId), product)),
      step: (productId: string, delta: 1 | -1) => update(stepQuantity(load(userId), productId, delta)),
      set: (productId: string, quantity: number) => update(setQuantity(load(userId), productId, quantity)),
      remove: (productId: string) => update(removeLine(load(userId), productId)),
      refresh: (products: readonly CartProduct[]) => update(refreshProducts(load(userId), products)),
      clear: () => update(EMPTY),
    };
  }, [lines, userId]);
}
