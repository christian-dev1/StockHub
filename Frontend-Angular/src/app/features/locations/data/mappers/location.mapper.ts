import { Location, LocationDraft } from '../../domain/entities/location';
import { LocationModel } from '../models/location.model';

export function toLocation(model: LocationModel): Location {
  return {
    id: model.id,
    code: model.code,
    name: model.name,
    type: model.type,
    addressLine: model.addressLine ?? null,
    city: model.city ?? null,
    phone: model.phone ?? null,
    primary: model.primary,
    active: model.active,
    version: model.version,
  };
}

/** Body of LocationRequest. */
export function toLocationRequest(draft: LocationDraft): Record<string, unknown> {
  return { ...draft };
}
