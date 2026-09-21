import { Observable } from 'rxjs';
import { RoleCode } from '../../../../core/config/permissions/permissions';
import { Page, PageRequest } from '../../../../shared/utils/page';
import { LocationOption, NewUser, Role, User, UserFilters } from '../entities/user';

export abstract class UsersRepository {
  abstract search(request: PageRequest, filters: UserFilters): Observable<Page<User>>;
  abstract get(id: string): Observable<User>;
  abstract create(user: NewUser): Observable<User>;
  abstract updateProfile(
    id: string,
    profile: { firstName: string; lastName: string; phone: string | null },
    version: number,
  ): Observable<User>;
  abstract changeRole(id: string, role: RoleCode): Observable<User>;
  abstract assignLocations(
    id: string,
    allLocations: boolean,
    locationIds: readonly string[],
  ): Observable<User>;
  abstract disable(id: string): Observable<User>;
  abstract activate(id: string): Observable<User>;
  abstract resetPassword(id: string, temporaryPassword: string): Observable<void>;
  abstract roles(): Observable<Role[]>;
  abstract locations(): Observable<LocationOption[]>;
}
