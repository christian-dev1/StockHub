import { API_ROUTES, PUBLIC_AUTH_ENDPOINTS } from '../config/routes/api.routes';
import { AppError, toAppError } from './api-error';

/**
 * Hooks installed by the auth module (avoids a circular import): token lookup
 * and a single-flight refresh used to replay a request after a 401.
 */
export interface AuthHooks {
  token(): string | null;
  refresh(): Promise<string>;
}

let authHooks: AuthHooks | null = null;

export function installAuthHooks(hooks: AuthHooks): void {
  authHooks = hooks;
}

function needsAuth(url: string): boolean {
  return url.startsWith(API_ROUTES.BASE) && !PUBLIC_AUTH_ENDPOINTS.includes(url);
}

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
  /** Statuses whose JSON body is valid data rather than a failure (e.g. actuator 503). */
  readonly acceptStatuses?: readonly number[];
}

async function readBody(response: Response): Promise<unknown> {
  const type = response.headers.get('content-type') ?? '';
  if (response.status === 204 || !type.includes('json')) {
    return undefined;
  }
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function currentLanguage(): string | undefined {
  return typeof document === 'undefined' ? undefined : document.documentElement.lang || undefined;
}

/**
 * Minimal fetch wrapper used by every data source: JSON in/out, same-origin
 * credentials (refresh cookie), language header and normalized {@link AppError}s.
 */
export async function httpRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const authenticated = needsAuth(url) && authHooks !== null;
  try {
    return await send<T>(url, options, authenticated ? authHooks?.token() : null);
  } catch (error) {
    if (!(error instanceof AppError) || error.status !== 401 || !authenticated || !authHooks) {
      throw error;
    }
    const token = await authHooks.refresh();
    return send<T>(url, options, token);
  }
}

async function send<T>(url: string, options: RequestOptions, token: string | null | undefined): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const language = currentLanguage();
  if (language) headers['Accept-Language'] = language;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new AppError('network', 0, 'NETWORK_ERROR', '');
  }

  const body = await readBody(response);
  if (response.ok || options.acceptStatuses?.includes(response.status)) {
    return body as T;
  }
  throw toAppError(response.status, body, response.headers.get('X-Request-Id'));
}
