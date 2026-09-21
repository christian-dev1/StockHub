import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody, AppError, AppErrorKind } from './app-error';

function kindFromStatus(status: number): AppErrorKind {
  if (status === 0) return 'network';
  if (status === 400) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'business';
  return 'server';
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return typeof body === 'object' && body !== null && 'code' in body;
}

/** Converts any HttpClient failure into the normalized {@link AppError}. */
export function mapHttpError(error: HttpErrorResponse): AppError {
  const kind = kindFromStatus(error.status);
  const body = isApiErrorBody(error.error) ? error.error : undefined;
  return {
    kind,
    status: error.status,
    code: body?.code ?? (kind === 'network' ? 'NETWORK_ERROR' : 'INTERNAL_ERROR'),
    message: body?.message ?? '',
    fieldErrors: body?.fieldErrors ?? [],
    requestId: body?.requestId ?? error.headers?.get('X-Request-Id') ?? undefined,
  };
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'code' in value &&
    'status' in value
  );
}
