export type AppErrorKind =
  'network' | 'unauthorized' | 'forbidden' | 'not-found' | 'validation' | 'conflict' | 'business' | 'server';

export interface FieldError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

/** Wire format of backend errors (Backend ApiError). */
export interface ApiErrorBody {
  readonly code?: string;
  readonly message?: string;
  readonly requestId?: string;
  readonly fieldErrors?: readonly FieldError[];
}

/** Normalized error thrown by the API client; never carries stack traces to the UI. */
export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: readonly FieldError[] = [],
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function kindFromStatus(status: number): AppErrorKind {
  if (status === 0) return 'network';
  if (status === 400) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'business';
  return 'server';
}

export function toAppError(status: number, body: unknown, requestId?: string | null): AppError {
  const apiBody =
    typeof body === 'object' && body !== null && 'code' in body ? (body as ApiErrorBody) : undefined;
  const kind = kindFromStatus(status);
  return new AppError(
    kind,
    status,
    apiBody?.code ?? (kind === 'network' ? 'NETWORK_ERROR' : 'INTERNAL_ERROR'),
    apiBody?.message ?? '',
    apiBody?.fieldErrors ?? [],
    apiBody?.requestId ?? requestId ?? undefined,
  );
}
