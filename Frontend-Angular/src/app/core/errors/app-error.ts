export type AppErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'conflict'
  | 'business'
  | 'server';

export interface FieldError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

/** Normalized error consumed by the UI; never contains stack traces. */
export interface AppError {
  readonly kind: AppErrorKind;
  readonly status: number;
  /** Stable backend code (e.g. PRODUCT_SKU_ALREADY_EXISTS), used as i18n key suffix. */
  readonly code: string;
  /** Message already localized by the backend, used when no frontend translation exists. */
  readonly message: string;
  readonly fieldErrors: readonly FieldError[];
  readonly requestId?: string;
}

/** Wire format of backend errors (see Backend ApiError). */
export interface ApiErrorBody {
  readonly timestamp?: string;
  readonly status?: number;
  readonly code?: string;
  readonly message?: string;
  readonly path?: string;
  readonly requestId?: string;
  readonly fieldErrors?: readonly FieldError[];
}
