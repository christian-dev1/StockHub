import { LocationType } from '../../domain/entities/location';

/** Wire format of LocationResponse. */
export interface LocationModel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: LocationType;
  readonly addressLine: string | null;
  readonly city: string | null;
  readonly phone: string | null;
  readonly primary: boolean;
  readonly active: boolean;
  readonly version: number;
}
