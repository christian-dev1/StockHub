import { Permission, RoleCode } from '../../../../core/config/permissions/permissions';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly role: RoleCode;
  readonly allLocations: boolean;
  readonly locationIds: readonly string[];
  readonly status: UserStatus;
  readonly mustChangePassword: boolean;
  readonly lastLoginAt: Date | null;
  readonly version: number;
}

export interface Role {
  readonly code: RoleCode;
  readonly assignable: boolean;
  readonly permissions: readonly Permission[];
}

export interface LocationOption {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly primary: boolean;
}

export interface NewUser {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string | null;
  readonly role: RoleCode;
  readonly allLocations: boolean;
  readonly locationIds: readonly string[];
  readonly temporaryPassword: string;
}

export interface UserFilters {
  readonly text: string;
  readonly role: RoleCode | null;
  readonly status: UserStatus | null;
}

/** Roles that must be restricted to explicit locations unless "all locations" is chosen. */
export function needsLocationChoice(role: RoleCode): boolean {
  return role !== 'ADMIN' && role !== 'SUPER_ADMIN';
}
