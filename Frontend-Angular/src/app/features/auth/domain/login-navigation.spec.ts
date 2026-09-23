import { APP_ROUTES } from '../../../core/config/routes/app.routes';
import { loginNavigation, safeReturnUrl } from './login-navigation';

describe('loginNavigation', () => {
  it('keeps sellers in Angular on the dashboard', () => {
    expect(loginNavigation({ mustChangePassword: false }, null)).toEqual({
      externalUrl: null,
      route: APP_ROUTES.ROOT,
    });
  });

  it('keeps a seller return URL inside Angular', () => {
    expect(loginNavigation({ mustChangePassword: false }, '/users')).toEqual({
      externalUrl: null,
      route: '/users',
    });
  });

  it('keeps back-office roles in Angular on their return URL', () => {
    expect(loginNavigation({ mustChangePassword: false }, '/stock')).toEqual({
      externalUrl: null,
      route: '/stock',
    });
    expect(loginNavigation({ mustChangePassword: false }, null)).toEqual({
      externalUrl: null,
      route: APP_ROUTES.ROOT,
    });
  });

  it('forces the password change first, even for a seller', () => {
    expect(loginNavigation({ mustChangePassword: true }, null)).toEqual({
      externalUrl: null,
      route: APP_ROUTES.CHANGE_PASSWORD,
    });
  });

  it('rejects open redirects', () => {
    expect(safeReturnUrl('//evil.example')).toBe(APP_ROUTES.ROOT);
    expect(safeReturnUrl('https://evil.example')).toBe(APP_ROUTES.ROOT);
    expect(safeReturnUrl('')).toBe(APP_ROUTES.ROOT);
    expect(safeReturnUrl(undefined)).toBe(APP_ROUTES.ROOT);
    expect(safeReturnUrl('/users?role=1')).toBe('/users?role=1');
  });
});
