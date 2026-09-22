import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { LocationModel } from '../models/location.model';

@Injectable()
export class LocationsDataSource {
  private readonly http = inject(HttpClient);

  list(includeInactive: boolean): Observable<LocationModel[]> {
    return this.http.get<LocationModel[]>(API_ROUTES.LOCATIONS.ROOT, {
      params: { includeInactive: String(includeInactive) },
    });
  }
  get(id: string): Observable<LocationModel> {
    return this.http.get<LocationModel>(API_ROUTES.LOCATIONS.ONE(id));
  }
  create(body: unknown): Observable<LocationModel> {
    return this.http.post<LocationModel>(API_ROUTES.LOCATIONS.ROOT, body);
  }
  update(id: string, body: unknown): Observable<LocationModel> {
    return this.http.put<LocationModel>(API_ROUTES.LOCATIONS.ONE(id), body);
  }
  activate(id: string): Observable<LocationModel> {
    return this.http.post<LocationModel>(API_ROUTES.LOCATIONS.ACTIVATE(id), null);
  }
  deactivate(id: string): Observable<LocationModel> {
    return this.http.post<LocationModel>(API_ROUTES.LOCATIONS.DEACTIVATE(id), null);
  }
  setPrimary(id: string): Observable<LocationModel> {
    return this.http.post<LocationModel>(API_ROUTES.LOCATIONS.SET_PRIMARY(id), null);
  }
}
