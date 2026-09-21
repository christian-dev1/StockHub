import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AuthApi } from './auth-api';
import { AuthStore } from './auth-store';
import { Session, TokenResponse } from './session.model';

const session: Session = {
  id: 'u1',
  email: 'admin@alpha.cm',
  firstName: 'Ada',
  lastName: 'Admin',
  role: 'ADMIN',
  permissions: ['USER_VIEW', 'USER_CREATE'],
  mustChangePassword: false,
  allLocations: true,
  locations: [{ id: 'l1', code: 'MAIN', name: 'Alpha - Principal', type: 'STORE', primary: true }],
  company: {
    id: 'c1',
    name: 'Alpha',
    currency: 'XAF',
    timezone: 'Africa/Douala',
    locale: 'fr',
    allowNegativeStock: false,
    expiryWarningDays: 30,
  },
};
const token = (value: string): TokenResponse => ({
  accessToken: value,
  tokenType: 'Bearer',
  expiresIn: 900,
  session,
});

describe('AuthStore', () => {
  let api: {
    login: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    me: ReturnType<typeof vi.fn>;
  };

  function create(): AuthStore {
    TestBed.configureTestingModule({ providers: [{ provide: AuthApi, useValue: api }] });
    return TestBed.inject(AuthStore);
  }

  beforeEach(() => {
    api = { login: vi.fn(), refresh: vi.fn(), logout: vi.fn(), me: vi.fn() };
  });

  it('keeps the token in memory and exposes permissions after login', () => {
    api.login.mockReturnValue(of(token('abc')));
    const store = create();

    store.login('admin@alpha.cm', 'secret').subscribe();

    expect(store.token()).toBe('abc');
    expect(store.isAuthenticated()).toBe(true);
    expect(store.can('USER_CREATE')).toBe(true);
    expect(store.can('COMPANY_CREATE')).toBe(false);
    expect(store.hasMultipleLocations()).toBe(false);
    expect(localStorage.length).toBe(0);
  });

  it('shares a single refresh call between concurrent callers', () => {
    const response = new Subject<TokenResponse>();
    api.refresh.mockReturnValue(response);
    const store = create();
    const received: string[] = [];

    store.refresh().subscribe((t) => received.push(t));
    store.refresh().subscribe((t) => received.push(t));
    response.next(token('fresh'));
    response.complete();

    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(received).toEqual(['fresh', 'fresh']);
  });

  it('restores an anonymous status when the refresh cookie is invalid', () => {
    api.refresh.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const store = create();
    let status = '';

    store.restore().subscribe((s) => (status = s));

    expect(status).toBe('anonymous');
    expect(store.session()).toBeNull();
  });

  it('clears the session on logout even if the server call fails', () => {
    api.login.mockReturnValue(of(token('abc')));
    api.logout.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const store = create();
    store.login('a', 'b').subscribe();

    store.logout().subscribe();

    expect(store.token()).toBeNull();
    expect(store.status()).toBe('anonymous');
  });
});
