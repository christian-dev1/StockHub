import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { Page } from '../../../../shared/utils/page';
import { LocationModel, RoleModel, UserModel } from '../models/user.model';

@Injectable()
export class UsersDataSource {
  private readonly http = inject(HttpClient);

  search(params: Record<string, string>): Observable<Page<UserModel>> {
    return this.http.get<Page<UserModel>>(API_ROUTES.USERS.ROOT, { params });
  }
  get(id: string): Observable<UserModel> {
    return this.http.get<UserModel>(API_ROUTES.USERS.ONE(id));
  }
  create(body: unknown): Observable<UserModel> {
    return this.http.post<UserModel>(API_ROUTES.USERS.ROOT, body);
  }
  update(id: string, body: unknown): Observable<UserModel> {
    return this.http.put<UserModel>(API_ROUTES.USERS.ONE(id), body);
  }
  changeRole(id: string, role: string): Observable<UserModel> {
    return this.http.put<UserModel>(API_ROUTES.USERS.ROLE(id), { role });
  }
  assignLocations(id: string, body: unknown): Observable<UserModel> {
    return this.http.put<UserModel>(API_ROUTES.USERS.LOCATIONS(id), body);
  }
  disable(id: string): Observable<UserModel> {
    return this.http.post<UserModel>(API_ROUTES.USERS.DISABLE(id), null);
  }
  activate(id: string): Observable<UserModel> {
    return this.http.post<UserModel>(API_ROUTES.USERS.ACTIVATE(id), null);
  }
  resetPassword(id: string, temporaryPassword: string): Observable<void> {
    return this.http.post<void>(API_ROUTES.USERS.RESET_PASSWORD(id), { temporaryPassword });
  }
  roles(): Observable<RoleModel[]> {
    return this.http.get<RoleModel[]>(API_ROUTES.ROLES);
  }
  locations(): Observable<LocationModel[]> {
    return this.http.get<LocationModel[]>(API_ROUTES.LOCATIONS.ROOT);
  }
}
