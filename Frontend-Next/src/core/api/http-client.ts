import { AppError, toAppError } from './api-error';

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
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
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
