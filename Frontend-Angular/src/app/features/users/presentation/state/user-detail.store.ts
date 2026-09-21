import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, switchMap, tap } from 'rxjs';
import { RoleCode } from '../../../../core/config/permissions/permissions';
import { AppError } from '../../../../core/errors/app-error';
import { isAppError } from '../../../../core/errors/http-error.mapper';
import { LoadState, failure, idle, loading, success } from '../../../../shared/utils/load-state';
import { User } from '../../domain/entities/user';
import { GetUserUseCase, UpdateUserUseCase } from '../../domain/use-cases/user.use-cases';

const UNKNOWN: AppError = {
  kind: 'server',
  status: 0,
  code: 'INTERNAL_ERROR',
  message: '',
  fieldErrors: [],
};

@Injectable()
export class UserDetailStore {
  private readonly getUser = inject(GetUserUseCase);
  private readonly update = inject(UpdateUserUseCase);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _state = signal<LoadState<User>>(idle());
  readonly state = this._state.asReadonly();
  readonly user = computed(() => {
    const s = this._state();
    return s.status === 'success' ? s.data : null;
  });

  load(id: string): void {
    this._state.set(loading());
    this.getUser
      .execute(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => this._state.set(success(user)),
        error: (error: unknown) => this._state.set(failure(isAppError(error) ? error : UNKNOWN)),
      });
  }

  saveProfile(profile: {
    firstName: string;
    lastName: string;
    phone: string | null;
  }): Observable<User> {
    const user = this.require();
    return this.keep(this.update.profile(user.id, profile, user.version));
  }

  saveAccess(
    role: RoleCode,
    allLocations: boolean,
    locationIds: readonly string[],
  ): Observable<User> {
    const user = this.require();
    const roleChange = role === user.role ? null : role;
    const apply = () => this.keep(this.update.locations(user.id, allLocations, locationIds));
    return roleChange
      ? this.keep(this.update.role(user.id, roleChange)).pipe(switchMap(apply))
      : apply();
  }

  disable(): Observable<User> {
    return this.keep(this.update.disable(this.require().id));
  }

  activate(): Observable<User> {
    return this.keep(this.update.activate(this.require().id));
  }

  resetPassword(temporaryPassword: string): Observable<void> {
    return this.update.resetPassword(this.require().id, temporaryPassword);
  }

  private keep(request: Observable<User>): Observable<User> {
    return request.pipe(tap((user) => this._state.set(success(user))));
  }

  private require(): User {
    const user = this.user();
    if (!user) throw new Error('User not loaded');
    return user;
  }
}
