import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, catchError, from, switchMap, throwError } from 'rxjs';
import { mapHttpError } from './http-error.mapper';

/** Repository operator: converts HTTP failures into normalized AppErrors. */
export function withAppErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) =>
    throwError(() => (error instanceof HttpErrorResponse ? mapHttpError(error) : error)),
  );
}

/**
 * Same as {@link withAppErrors} for requests expecting a file: the error body
 * then arrives as a Blob and is parsed back to JSON so that its code survives.
 */
export function withBlobAppErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => {
    if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) {
      return throwError(() => (error instanceof HttpErrorResponse ? mapHttpError(error) : error));
    }
    return from(error.error.text()).pipe(
      switchMap((text) =>
        throwError(() =>
          mapHttpError(
            new HttpErrorResponse({
              error: parseJson(text),
              status: error.status,
              headers: error.headers,
              url: error.url ?? undefined,
            }),
          ),
        ),
      ),
    );
  });
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
