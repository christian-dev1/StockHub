import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RoleCode } from '../../../../core/config/permissions/permissions';
import { Page, PageRequest } from '../../../../shared/utils/page';
import {
  LocationOption,
  NewUser,
  Role,
  User,
  UserFilters,
  needsLocationChoice,
} from '../entities/user';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class SearchUsersUseCase {
  private readonly repository = inject(UsersRepository);
  execute(request: PageRequest, filters: UserFilters): Observable<Page<User>> {
    return this.repository.search(request, { ...filters, text: filters.text.trim() });
  }
}

@Injectable()
export class GetUserUseCase {
  private readonly repository = inject(UsersRepository);
  execute(id: string): Observable<User> {
    return this.repository.get(id);
  }
}

/** Admins always get every location; other roles keep the explicit choice. */
@Injectable()
export class CreateUserUseCase {
  private readonly repository = inject(UsersRepository);
  execute(user: NewUser): Observable<User> {
    const allLocations = !needsLocationChoice(user.role) || user.allLocations;
    return this.repository.create({
      ...user,
      email: user.email.trim().toLowerCase(),
      allLocations,
      locationIds: allLocations ? [] : user.locationIds,
    });
  }
}

@Injectable()
export class UpdateUserUseCase {
  private readonly repository = inject(UsersRepository);
  profile(
    id: string,
    profile: { firstName: string; lastName: string; phone: string | null },
    version: number,
  ): Observable<User> {
    return this.repository.updateProfile(id, profile, version);
  }
  role(id: string, role: RoleCode): Observable<User> {
    return this.repository.changeRole(id, role);
  }
  locations(id: string, allLocations: boolean, locationIds: readonly string[]): Observable<User> {
    return this.repository.assignLocations(id, allLocations, allLocations ? [] : locationIds);
  }
  disable(id: string): Observable<User> {
    return this.repository.disable(id);
  }
  activate(id: string): Observable<User> {
    return this.repository.activate(id);
  }
  resetPassword(id: string, temporaryPassword: string): Observable<void> {
    return this.repository.resetPassword(id, temporaryPassword);
  }
}

@Injectable()
export class GetUserReferenceDataUseCase {
  private readonly repository = inject(UsersRepository);
  assignableRoles(): Observable<Role[]> {
    return this.repository.roles().pipe(map((roles) => roles.filter((role) => role.assignable)));
  }
  locations(): Observable<LocationOption[]> {
    return this.repository.locations();
  }
}
