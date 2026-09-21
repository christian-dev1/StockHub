export type CompanyStatus = 'ACTIVE' | 'DISABLED';

export interface CompanyProfile {
  readonly name: string;
  readonly legalName: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly addressLine: string | null;
  readonly city: string | null;
  readonly country: string | null;
}

export interface CompanySettings {
  readonly allowNegativeStock: boolean;
  readonly expiryWarningDays: number;
  readonly defaultLeadTimeDays: number;
}

export interface Company extends CompanyProfile {
  readonly id: string;
  readonly currency: string;
  readonly timezone: string;
  readonly locale: 'fr' | 'en';
  readonly status: CompanyStatus;
  readonly settings: CompanySettings;
  readonly version: number;
}

export interface AdminAccount {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly temporaryPassword: string;
}

export interface CompanyOnboarding {
  readonly profile: CompanyProfile;
  readonly currency: string;
  readonly timezone: string;
  readonly locale: 'fr' | 'en';
  readonly admin: AdminAccount;
}

export interface CompanyFilters {
  readonly text: string;
  readonly status: CompanyStatus | null;
}
