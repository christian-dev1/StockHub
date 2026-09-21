import { Permission, RoleCode } from '../config/permissions/permissions';

export interface SessionLocation {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: 'STORE' | 'WAREHOUSE' | 'DEPOT';
  readonly primary: boolean;
}

export interface SessionCompany {
  readonly id: string;
  readonly name: string;
  readonly currency: string;
  readonly timezone: string;
  readonly locale: string;
  readonly allowNegativeStock: boolean;
  readonly expiryWarningDays: number;
}

/** Authenticated user as described by GET /auth/me (server is the authority). */
export interface Session {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: RoleCode;
  readonly permissions: readonly Permission[];
  readonly mustChangePassword: boolean;
  readonly allLocations: boolean;
  readonly locations: readonly SessionLocation[];
  readonly company: SessionCompany | null;
}

export interface TokenResponse {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
  readonly session: Session;
}
