export const LOCATION_TYPES = ['STORE', 'WAREHOUSE', 'DEPOT'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

/** A store, warehouse or depot of the company; exactly one is primary. */
export interface Location {
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

export interface LocationDraft {
  readonly code: string;
  readonly name: string;
  readonly type: LocationType;
  readonly addressLine: string | null;
  readonly city: string | null;
  readonly phone: string | null;
}

/** Primary first, then active before inactive, then by name. */
export function sortLocations(locations: readonly Location[]): Location[] {
  return [...locations].sort(
    (a, b) =>
      Number(b.primary) - Number(a.primary) ||
      Number(b.active) - Number(a.active) ||
      a.name.localeCompare(b.name),
  );
}

/** One-line address for lists ("Rue de la Joie, Douala"). */
export function formatAddress(location: Pick<Location, 'addressLine' | 'city'>): string {
  return [location.addressLine, location.city].filter(Boolean).join(', ');
}
