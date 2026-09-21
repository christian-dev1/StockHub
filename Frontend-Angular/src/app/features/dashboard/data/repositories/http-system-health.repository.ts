import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { mapHttpError } from '../../../../core/errors/http-error.mapper';
import { SystemHealth } from '../../domain/entities/system-health';
import { SystemHealthRepository } from '../../domain/repositories/system-health.repository';
import { SystemHealthDataSource } from '../datasources/system-health.datasource';
import { toSystemHealth } from '../mappers/system-health.mapper';

@Injectable()
export class HttpSystemHealthRepository extends SystemHealthRepository {
  private readonly dataSource = inject(SystemHealthDataSource);

  check(): Observable<SystemHealth> {
    return this.dataSource.fetch().pipe(
      map((model) => toSystemHealth(model, new Date())),
      catchError((error: HttpErrorResponse) => throwError(() => mapHttpError(error))),
    );
  }
}
