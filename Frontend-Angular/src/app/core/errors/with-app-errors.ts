import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, catchError, throwError } from 'rxjs';
import { mapHttpError } from './http-error.mapper';

/** Repository operator: converts HTTP failures into normalized AppErrors. */
export function withAppErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) =>
    throwError(() => (error instanceof HttpErrorResponse ? mapHttpError(error) : error)),
  );
}
