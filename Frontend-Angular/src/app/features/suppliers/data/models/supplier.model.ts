/** Wire format of SupplierResponse. */
export interface SupplierModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly contactName: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly addressLine: string | null;
  readonly city: string | null;
  readonly country: string | null;
  readonly taxId: string | null;
  readonly leadTimeDays: number | null;
  readonly notes: string | null;
  readonly active: boolean;
  readonly version: number;
}
