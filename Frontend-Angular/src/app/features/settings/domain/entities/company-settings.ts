export interface CurrentCompany {
  readonly id: string;
  readonly name: string;
  readonly legalName: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly addressLine: string | null;
  readonly city: string | null;
  readonly country: string | null;
  readonly currency: string;
  readonly timezone: string;
  readonly locale: 'fr' | 'en';
  readonly allowNegativeStock: boolean;
  readonly expiryWarningDays: number;
  readonly defaultLeadTimeDays: number;
  readonly version: number;
}

export type CompanyProfileUpdate = Pick<
  CurrentCompany,
  'name' | 'legalName' | 'email' | 'phone' | 'addressLine' | 'city' | 'country'
>;

export type CompanySettingsUpdate = Pick<
  CurrentCompany,
  | 'currency'
  | 'timezone'
  | 'locale'
  | 'allowNegativeStock'
  | 'expiryWarningDays'
  | 'defaultLeadTimeDays'
>;
