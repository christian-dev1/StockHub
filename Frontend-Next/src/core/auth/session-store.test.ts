import { describe, expect, it, vi } from 'vitest';
import type { TokenResponse } from './session';
import { sessionStore } from './session-store';

const response: TokenResponse = {
  accessToken: 'abc',
  tokenType: 'Bearer',
  expiresIn: 900,
  session: {
    id: 'u1',
    email: 'seller@shop.cm',
    firstName: 'Sam',
    lastName: 'Seller',
    role: 'VENDEUR',
    permissions: ['SALE_CREATE'],
    mustChangePassword: false,
    allLocations: false,
    locations: [],
    company: null,
  },
};

describe('sessionStore', () => {
  it('keeps the token in memory and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = sessionStore.subscribe(listener);

    sessionStore.apply(response);
    expect(sessionStore.token()).toBe('abc');
    expect(sessionStore.getState().status).toBe('authenticated');

    sessionStore.clear();
    expect(sessionStore.token()).toBeNull();
    expect(sessionStore.getState()).toEqual({ status: 'anonymous', session: null });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(window.localStorage.length).toBe(0);
    unsubscribe();
  });
});
