export interface Supplier {
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
  /** Delivery delay in days, used later by replenishment forecasts. */
  readonly leadTimeDays: number | null;
  readonly notes: string | null;
  readonly active: boolean;
  readonly version: number;
}

/** `code` may be blank on creation: the backend then generates it. */
export interface SupplierDraft {
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
}

export interface SupplierFilters {
  readonly text: string;
  readonly active: boolean | null;
}
