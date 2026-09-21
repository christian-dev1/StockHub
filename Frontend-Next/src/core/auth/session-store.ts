import type { Session, TokenResponse } from './session';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface State {
  readonly status: AuthStatus;
  readonly session: Session | null;
}

/**
 * Client session kept in memory only (never in localStorage): the access token
 * disappears with the tab, and a reload restores the session via the HttpOnly
 * refresh cookie. Exposed to React through useSyncExternalStore.
 */
class SessionStore {
  private state: State = { status: 'unknown', session: null };
  private accessToken: string | null = null;
  private readonly listeners = new Set<() => void>();

  getState = (): State => this.state;

  getServerState = (): State => SERVER_STATE;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  token(): string | null {
    return this.accessToken;
  }

  apply(response: TokenResponse): void {
    this.accessToken = response.accessToken;
    this.set({ status: 'authenticated', session: response.session });
  }

  clear(): void {
    this.accessToken = null;
    this.set({ status: 'anonymous', session: null });
  }

  private set(next: State): void {
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }
}

const SERVER_STATE: State = { status: 'unknown', session: null };

export const sessionStore = new SessionStore();
