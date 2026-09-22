import { Observable } from 'rxjs';
import { Location, LocationDraft } from '../entities/location';

export abstract class LocationsRepository {
  abstract list(includeInactive: boolean): Observable<Location[]>;
  abstract get(id: string): Observable<Location>;
  abstract create(draft: LocationDraft): Observable<Location>;
  abstract update(id: string, draft: LocationDraft, version: number): Observable<Location>;
  abstract activate(id: string): Observable<Location>;
  abstract deactivate(id: string): Observable<Location>;
  abstract setPrimary(id: string): Observable<Location>;
}
