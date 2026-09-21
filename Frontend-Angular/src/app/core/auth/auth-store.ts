import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { Permission } from '../config/permissions/permissions';
import { AuthApi } from './auth-api';
import { Session, TokenResponse } from './session.model';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

/**
 * Client-side session. The access token lives in memory only (never in
 * storage); a page reload restores the session through the refresh cookie.
 * Permissions drive the UI only: the backend re-checks every request.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);

  private readonly _session = signal<Session | null>(null);
  private readonly _status = signal<AuthStatus>('unknown');
  private accessToken: string | null = null;
  private refreshInFlight: Observable<string> | null = null;
  private restoreInFlight: Observable<AuthStatus> | null = null;

  readonly session = this._session.asReadonly();
  readonly status = this._status.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');
  readonly isSuperAdmin = computed(() => this._session()?.role === 'SUPER_ADMIN');
  readonly mustChangePassword = computed(() => this._session()?.mustChangePassword ?? false);
  readonly company = computed(() => this._session()?.company ?? null);
  readonly locations = computed(() => this._session()?.locations ?? []);
  readonly hasMultipleLocations = computed(() => this.locations().length > 1);
  readonly displayName = computed(() => {
    const s = this._session();
    return s ? `${s.firstName} ${s.lastName}` : '';
  });

  private readonly permissionSet = computed(
    () => new Set<Permission>(this._session()?.permissions ?? []),
  );

  token(): string | null {
    return this.accessToken;
  }

  can(permission: Permission): boolean {
    return this.permissionSet().has(permission);
  }

  canAny(permissions: readonly Permission[]): boolean {
    return permissions.length === 0 || permissions.some((p) => this.can(p));
  }

  login(email: string, password: string): Observable<Session> {
    return this.api.login(email, password).pipe(
      tap((response) => this.apply(response)),
      map((response) => response.session),
    );
  }

  /** Called once at startup and by guards: resolves whether a session can be restored. */
  restore(): Observable<AuthStatus> {
    if (this._status() !== 'unknown') {
      return of(this._status());
    }
    this.restoreInFlight ??= this.refresh().pipe(
      map((): AuthStatus => 'authenticated'),
      catchError(() => of<AuthStatus>('anonymous')),
      finalize(() => (this.restoreInFlight = null)),
      shareReplay(1),
    );
    return this.restoreInFlight;
  }

  /** Single-flight refresh: concurrent 401s share one refresh call. */
  refresh(): Observable<string> {
    this.refreshInFlight ??= this.api.refresh().pipe(
      tap((response) => this.apply(response)),
      map((response) => response.accessToken),
      catchError((error: unknown) => {
        this.clear();
        return throwError(() => error);
      }),
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );
    return this.refreshInFlight;
  }

  reloadSession(): Observable<Session> {
    return this.api.me().pipe(tap((session) => this._session.set(session)));
  }

  logout(): Observable<void> {
    return this.api.logout().pipe(
      catchError(() => of(undefined)),
      map(() => undefined),
      finalize(() => this.clear()),
    );
  }

  /** Called after a password change: the backend revoked every session. */
  clear(): void {
    this.accessToken = null;
    this._session.set(null);
    this._status.set('anonymous');
  }

  private apply(response: TokenResponse): void {
    this.accessToken = response.accessToken;
    this._session.set(response.session);
    this._status.set('authenticated');
  }
}
