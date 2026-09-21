import type { Permission, RoleCode } from '../config/permissions/permissions';

export interface SessionLocation {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: 'STORE' | 'WAREHOUSE' | 'DEPOT';
  readonly primary: boolean;
}

export interface Session {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: RoleCode;
  readonly permissions: readonly (Permission | string)[];
  readonly mustChangePassword: boolean;
  readonly allLocations: boolean;
  readonly locations: readonly SessionLocation[];
  readonly company: {
    readonly id: string;
    readonly name: string;
    readonly currency: string;
    readonly timezone: string;
    readonly locale: string;
  } | null;
}

export interface TokenResponse {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
  readonly session: Session;
}
