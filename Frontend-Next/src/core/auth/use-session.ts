'use client';

import { useSyncExternalStore } from 'react';
import type { Permission } from '../config/permissions/permissions';
import { sessionStore } from './session-store';

export function useSession() {
  const state = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getState,
    sessionStore.getServerState,
  );
  const permissions = new Set(state.session?.permissions ?? []);
  return {
    ...state,
    can: (permission: Permission) => permissions.has(permission),
  };
}
