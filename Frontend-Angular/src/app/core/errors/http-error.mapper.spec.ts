import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { isAppError, mapHttpError } from './http-error.mapper';

describe('mapHttpError', () => {
  it('keeps the backend code, message and field errors', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Données invalides',
        requestId: 'req-12345678',
        fieldErrors: [{ field: 'sku', code: 'NotBlank', message: 'must not be blank' }],
      },
    });

    const mapped = mapHttpError(error);

    expect(mapped).toEqual({
      kind: 'validation',
      status: 400,
      code: 'VALIDATION_FAILED',
      message: 'Données invalides',
      fieldErrors: [{ field: 'sku', code: 'NotBlank', message: 'must not be blank' }],
      requestId: 'req-12345678',
    });
  });

  it.each([
    [0, 'network'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [422, 'business'],
    [500, 'server'],
  ])('maps status %i to kind %s', (status, kind) => {
    expect(mapHttpError(new HttpErrorResponse({ status })).kind).toBe(kind);
  });

  it('falls back to a generic code when the body is not an API error', () => {
    const mapped = mapHttpError(
      new HttpErrorResponse({
        status: 502,
        error: '<html>Bad gateway</html>',
        headers: new HttpHeaders({ 'X-Request-Id': 'abc-12345' }),
      }),
    );
    expect(mapped.code).toBe('INTERNAL_ERROR');
    expect(mapped.requestId).toBe('abc-12345');
  });

  it('flags network failures', () => {
    expect(mapHttpError(new HttpErrorResponse({ status: 0 })).code).toBe('NETWORK_ERROR');
  });

  it('recognizes mapped errors', () => {
    expect(isAppError(mapHttpError(new HttpErrorResponse({ status: 500 })))).toBe(true);
    expect(isAppError(new Error('boom'))).toBe(false);
  });
});
