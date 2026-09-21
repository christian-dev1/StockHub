import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { HealthResponseModel } from '../models/health-response.model';

@Injectable()
export class SystemHealthDataSource {
  private readonly http = inject(HttpClient);

  fetch(): Observable<HealthResponseModel> {
    return this.http.get<HealthResponseModel>(API_ROUTES.SYSTEM.HEALTH).pipe(
      // Actuator answers 503 with a DOWN body: that is data, not a transport failure.
      catchError((error: HttpErrorResponse) =>
        error.status === 503 && error.error
          ? of(error.error as HealthResponseModel)
          : throwError(() => error),
      ),
    );
  }
}
