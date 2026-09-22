import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Location, LocationDraft, sortLocations } from '../entities/location';
import { LocationsRepository } from '../repositories/locations.repository';

@Injectable()
export class ListLocationsUseCase {
  private readonly repository = inject(LocationsRepository);
  execute(includeInactive: boolean): Observable<Location[]> {
    return this.repository.list(includeInactive).pipe(map(sortLocations));
  }
}

@Injectable()
export class GetLocationUseCase {
  private readonly repository = inject(LocationsRepository);
  execute(id: string): Observable<Location> {
    return this.repository.get(id);
  }
}

/** Codes are stored upper-case; blank optional fields are sent as null. */
@Injectable()
export class SaveLocationUseCase {
  private readonly repository = inject(LocationsRepository);

  create(draft: LocationDraft): Observable<Location> {
    return this.repository.create(normalize(draft));
  }

  update(id: string, draft: LocationDraft, version: number): Observable<Location> {
    return this.repository.update(id, normalize(draft), version);
  }
}

@Injectable()
export class ChangeLocationStatusUseCase {
  private readonly repository = inject(LocationsRepository);
  activate(id: string): Observable<Location> {
    return this.repository.activate(id);
  }
  deactivate(id: string): Observable<Location> {
    return this.repository.deactivate(id);
  }
  setPrimary(id: string): Observable<Location> {
    return this.repository.setPrimary(id);
  }
}

function normalize(draft: LocationDraft): LocationDraft {
  const optional = (value: string | null) => value?.trim() || null;
  return {
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    type: draft.type,
    addressLine: optional(draft.addressLine),
    city: optional(draft.city),
    phone: optional(draft.phone),
  };
}
