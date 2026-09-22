import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors } from '../../../../core/errors/with-app-errors';
import { Location, LocationDraft } from '../../domain/entities/location';
import { LocationsRepository } from '../../domain/repositories/locations.repository';
import { LocationsDataSource } from '../datasources/locations.datasource';
import { toLocation, toLocationRequest } from '../mappers/location.mapper';

@Injectable()
export class HttpLocationsRepository extends LocationsRepository {
  private readonly source = inject(LocationsDataSource);

  list(includeInactive: boolean): Observable<Location[]> {
    return this.source.list(includeInactive).pipe(
      map((locations) => locations.map(toLocation)),
      withAppErrors(),
    );
  }
  get(id: string): Observable<Location> {
    return this.source.get(id).pipe(map(toLocation), withAppErrors());
  }
  create(draft: LocationDraft): Observable<Location> {
    return this.source.create(toLocationRequest(draft)).pipe(map(toLocation), withAppErrors());
  }
  update(id: string, draft: LocationDraft, version: number): Observable<Location> {
    return this.source
      .update(id, { location: toLocationRequest(draft), version })
      .pipe(map(toLocation), withAppErrors());
  }
  activate(id: string): Observable<Location> {
    return this.source.activate(id).pipe(map(toLocation), withAppErrors());
  }
  deactivate(id: string): Observable<Location> {
    return this.source.deactivate(id).pipe(map(toLocation), withAppErrors());
  }
  setPrimary(id: string): Observable<Location> {
    return this.source.setPrimary(id).pipe(map(toLocation), withAppErrors());
  }
}
