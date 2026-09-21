import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RoleCode } from '../../../../core/config/permissions/permissions';
import { withAppErrors } from '../../../../core/errors/with-app-errors';
import { Page, PageRequest, mapPage, toQueryParams } from '../../../../shared/utils/page';
import { LocationOption, NewUser, Role, User, UserFilters } from '../../domain/entities/user';
import { UsersRepository } from '../../domain/repositories/users.repository';
import { UsersDataSource } from '../datasources/users.datasource';
import { toLocationOption, toRole, toUser } from '../mappers/user.mapper';

@Injectable()
export class HttpUsersRepository extends UsersRepository {
  private readonly source = inject(UsersDataSource);

  search(request: PageRequest, filters: UserFilters): Observable<Page<User>> {
    return this.source
      .search(
        toQueryParams(request, { q: filters.text, role: filters.role, status: filters.status }),
      )
      .pipe(
        map((page) => mapPage(page, toUser)),
        withAppErrors(),
      );
  }
  get(id: string): Observable<User> {
    return this.source.get(id).pipe(map(toUser), withAppErrors());
  }
  create(user: NewUser): Observable<User> {
    return this.source
      .create({ ...user, phone: user.phone || null })
      .pipe(map(toUser), withAppErrors());
  }
  updateProfile(
    id: string,
    profile: { firstName: string; lastName: string; phone: string | null },
    version: number,
  ): Observable<User> {
    return this.source
      .update(id, { ...profile, phone: profile.phone || null, version })
      .pipe(map(toUser), withAppErrors());
  }
  changeRole(id: string, role: RoleCode): Observable<User> {
    return this.source.changeRole(id, role).pipe(map(toUser), withAppErrors());
  }
  assignLocations(
    id: string,
    allLocations: boolean,
    locationIds: readonly string[],
  ): Observable<User> {
    return this.source
      .assignLocations(id, { allLocations, locationIds })
      .pipe(map(toUser), withAppErrors());
  }
  disable(id: string): Observable<User> {
    return this.source.disable(id).pipe(map(toUser), withAppErrors());
  }
  activate(id: string): Observable<User> {
    return this.source.activate(id).pipe(map(toUser), withAppErrors());
  }
  resetPassword(id: string, temporaryPassword: string): Observable<void> {
    return this.source.resetPassword(id, temporaryPassword).pipe(withAppErrors());
  }
  roles(): Observable<Role[]> {
    return this.source.roles().pipe(
      map((roles) => roles.map(toRole)),
      withAppErrors(),
    );
  }
  locations(): Observable<LocationOption[]> {
    return this.source.locations().pipe(
      map((locations) => locations.map(toLocationOption)),
      withAppErrors(),
    );
  }
}
