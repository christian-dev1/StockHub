import { Permission, RoleCode } from '../../../../core/config/permissions/permissions';

export interface UserModel {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string | null;
  readonly role: RoleCode;
  readonly allLocations: boolean;
  readonly locationIds: string[];
  readonly status: 'ACTIVE' | 'DISABLED';
  readonly mustChangePassword: boolean;
  readonly lastLoginAt: string | null;
  readonly version: number;
}

export interface RoleModel {
  readonly code: RoleCode;
  readonly platform: boolean;
  readonly assignable: boolean;
  readonly permissions: Permission[];
}

export interface LocationModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: string;
  readonly primary: boolean;
  readonly active: boolean;
}
