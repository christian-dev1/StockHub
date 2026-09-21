import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../config/routes/api.routes';
import { Session, TokenResponse } from './session.model';

/** HTTP calls of the authentication flow. The refresh token travels in an HttpOnly cookie. */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(API_ROUTES.AUTH.LOGIN, { email, password });
  }

  refresh(): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(API_ROUTES.AUTH.REFRESH, null);
  }

  logout(): Observable<void> {
    return this.http.post<void>(API_ROUTES.AUTH.LOGOUT, null);
  }

  me(): Observable<Session> {
    return this.http.get<Session>(API_ROUTES.AUTH.ME);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(API_ROUTES.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
  }
}
