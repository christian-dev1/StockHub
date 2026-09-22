import { Provider } from '@angular/core';
import { LocationsDataSource } from './data/datasources/locations.datasource';
import { HttpLocationsRepository } from './data/repositories/http-locations.repository';
import { LocationsRepository } from './domain/repositories/locations.repository';
import {
  ChangeLocationStatusUseCase,
  GetLocationUseCase,
  ListLocationsUseCase,
  SaveLocationUseCase,
} from './domain/use-cases/location.use-cases';

export const LOCATIONS_PROVIDERS: Provider[] = [
  LocationsDataSource,
  { provide: LocationsRepository, useClass: HttpLocationsRepository },
  ListLocationsUseCase,
  GetLocationUseCase,
  SaveLocationUseCase,
  ChangeLocationStatusUseCase,
];
