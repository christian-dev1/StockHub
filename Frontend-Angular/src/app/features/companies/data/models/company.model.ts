/** Wire format of CompanyResponse (Backend company module). */
export interface CompanyModel {
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
  readonly locale: string;
  readonly status: 'ACTIVE' | 'DISABLED';
  readonly settings: {
    allowNegativeStock: boolean;
    expiryWarningDays: number;
    defaultLeadTimeDays: number;
  };
  readonly version: number;
}

export interface OnboardingModel {
  readonly company: CompanyModel;
  readonly primaryLocationId: string;
  readonly adminUserId: string;
}
