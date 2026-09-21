import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from './api-error';
import { httpRequest } from './http-client';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('httpRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns parsed JSON on success and sends the document language', async () => {
    document.documentElement.lang = 'en';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(httpRequest('/x')).resolves.toEqual({ ok: true });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>)['Accept-Language']).toBe('en');
    expect(init.credentials).toBe('same-origin');
  });

  it('serializes bodies as JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await httpRequest('/x', { method: 'POST', body: { a: 1 } });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBe('{"a":1}');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('throws a normalized AppError with backend code and field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(409, {
          code: 'PRODUCT_SKU_ALREADY_EXISTS',
          message: 'SKU déjà utilisé',
          requestId: 'r-12345678',
        }),
      ),
    );

    const error = await httpRequest('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: 'conflict',
      status: 409,
      code: 'PRODUCT_SKU_ALREADY_EXISTS',
      requestId: 'r-12345678',
    });
  });

  it('maps transport failures to a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(httpRequest('/x')).rejects.toMatchObject({ kind: 'network', code: 'NETWORK_ERROR' });
  });

  it('accepts explicitly allowed error statuses as data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(503, { status: 'DOWN' })));
    await expect(httpRequest('/x', { acceptStatuses: [503] })).resolves.toEqual({ status: 'DOWN' });
  });
});
