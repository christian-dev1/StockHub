import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import { API_ROUTES } from '../config/routes/api.routes';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: { token: ReturnType<typeof vi.fn>; refresh: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn>; url: string };

  beforeEach(() => {
    auth = { token: vi.fn().mockReturnValue('old'), refresh: vi.fn() };
    router = { navigate: vi.fn(), url: '/users' };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('adds the bearer token to API calls', () => {
    http.get(API_ROUTES.USERS.ROOT).subscribe();
    expect(backend.expectOne(API_ROUTES.USERS.ROOT).request.headers.get('Authorization')).toBe(
      'Bearer old',
    );
  });

  it('never sends the token to authentication endpoints', () => {
    http.post(API_ROUTES.AUTH.LOGIN, {}).subscribe();
    expect(backend.expectOne(API_ROUTES.AUTH.LOGIN).request.headers.has('Authorization')).toBe(
      false,
    );
  });

  it('refreshes once on 401 and replays the request with the new token', () => {
    auth.refresh.mockReturnValue(of('new'));
    let body: unknown;
    http.get(API_ROUTES.USERS.ROOT).subscribe((b) => (body = b));

    backend
      .expectOne(API_ROUTES.USERS.ROOT)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    const retry = backend.expectOne(API_ROUTES.USERS.ROOT);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush({ ok: true });

    expect(body).toEqual({ ok: true });
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });

  it('redirects to login when the refresh fails', () => {
    auth.refresh.mockReturnValue(throwError(() => new Error('expired')));
    http.get(API_ROUTES.USERS.ROOT).subscribe({ error: () => undefined });

    backend
      .expectOne(API_ROUTES.USERS.ROOT)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/users', expired: 1 },
    });
  });

  it('does not refresh on 403', () => {
    let status = 0;
    http
      .get(API_ROUTES.USERS.ROOT)
      .subscribe({ error: (e: { status: number }) => (status = e.status) });
    backend.expectOne(API_ROUTES.USERS.ROOT).flush(null, { status: 403, statusText: 'Forbidden' });
    expect(status).toBe(403);
    expect(auth.refresh).not.toHaveBeenCalled();
  });
});
