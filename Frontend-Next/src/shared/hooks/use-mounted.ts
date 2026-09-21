import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** True only on the client after hydration (for values unknown to the server, e.g. theme). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
