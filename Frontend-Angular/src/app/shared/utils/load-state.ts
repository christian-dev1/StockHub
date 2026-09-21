import { AppError } from '../../core/errors/app-error';

/** Explicit UI state of any asynchronous data a page displays. */
export type LoadState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly error: AppError };

export const idle = <T>(): LoadState<T> => ({ status: 'idle' });
export const loading = <T>(): LoadState<T> => ({ status: 'loading' });
export const success = <T>(data: T): LoadState<T> => ({ status: 'success', data });
export const empty = <T>(): LoadState<T> => ({ status: 'empty' });
export const failure = <T>(error: AppError): LoadState<T> => ({ status: 'error', error });
