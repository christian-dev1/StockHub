import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import {
  authGuard,
  backOfficeGuard,
  permissionGuard,
  platformGuard,
  salesAppOnlyGuard,
} from './auth.guards';

describe('auth guards', () => {
  let auth: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    auth = {
      restore: vi.fn().mockReturnValue(of('authenticated')),
      mustChangePassword: vi.fn().mockReturnValue(false),
      canAny: vi.fn().mockReturnValue(true),
      isSuperAdmin: vi.fn().mockReturnValue(false),
      canUseBackOffice: vi.fn().mockReturnValue(true),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: auth }],
    });
  });

  const state = { url: '/users' } as RouterStateSnapshot;
  const route = (data: Record<string, unknown> = {}) =>
    ({ data }) as unknown as ActivatedRouteSnapshot;
  const serialize = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  it('lets authenticated users through', async () => {
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => authGuard(route(), state)) as Observable<unknown>,
    );
    expect(result).toBe(true);
  });

  it('redirects anonymous users to login with the return URL', async () => {
    auth['restore'].mockReturnValue(of('anonymous'));
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => authGuard(route(), state)) as Observable<unknown>,
    );
    expect(serialize(result)).toBe('/login?returnUrl=%2Fusers');
  });

  it('forces a password change first', async () => {
    auth['mustChangePassword'].mockReturnValue(true);
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => authGuard(route(), state)) as Observable<unknown>,
    );
    expect(serialize(result)).toBe('/change-password');
  });

  it('sends users without the permission to 403', () => {
    auth['canAny'].mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route({ permissions: ['USER_VIEW'] }), state),
    );
    expect(serialize(result)).toBe('/forbidden');
  });

  it('reserves the platform area to the super admin', () => {
    const result = TestBed.runInInjectionContext(() => platformGuard(route(), state));
    expect(serialize(result)).toBe('/forbidden');
  });

  it('opens the back-office to back-office roles', async () => {
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => backOfficeGuard(route(), state)) as Observable<unknown>,
    );
    expect(result).toBe(true);
  });

  it('sends sellers to the sales-app-only page', async () => {
    auth['canUseBackOffice'].mockReturnValue(false);
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => backOfficeGuard(route(), state)) as Observable<unknown>,
    );
    expect(serialize(result)).toBe('/sales-app-only');
  });

  it('leaves anonymous users to the login redirect of authGuard', async () => {
    auth['restore'].mockReturnValue(of('anonymous'));
    auth['canUseBackOffice'].mockReturnValue(false);
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => backOfficeGuard(route(), state)) as Observable<unknown>,
    );
    expect(result).toBe(true);
  });

  it('keeps back-office users away from the sales-app-only page', () => {
    const result = TestBed.runInInjectionContext(() => salesAppOnlyGuard(route(), state));
    expect(serialize(result)).toBe('/dashboard');
  });
});
