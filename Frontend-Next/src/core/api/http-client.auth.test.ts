import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ROUTES } from '../config/routes/api.routes';
import { httpRequest, installAuthHooks } from './http-client';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('httpRequest with authentication', () => {
  const refresh = vi.fn<() => Promise<string>>();
  let token: string | null = 'old';

  beforeEach(() => {
    token = 'old';
    refresh.mockReset();
    installAuthHooks({ token: () => token, refresh });
  });
  afterEach(() => vi.unstubAllGlobals());

  const authorization = (call: unknown[]) =>
    ((call[1] as RequestInit).headers as Record<string, string>)['Authorization'];

  it('sends the bearer token to API endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    await httpRequest(API_ROUTES.LOCATIONS);
    expect(authorization(fetchMock.mock.calls[0]!)).toBe('Bearer old');
  });

  it('never sends the token to the login endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    await httpRequest(API_ROUTES.AUTH.LOGIN, { method: 'POST', body: {} });
    expect(authorization(fetchMock.mock.calls[0]!)).toBeUndefined();
  });

  it('refreshes after a 401 and replays the request once', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, { code: 'UNAUTHORIZED' }))
      .mockResolvedValueOnce(json(200, { ok: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    refresh.mockImplementation(async () => {
      token = 'new';
      return 'new';
    });

    await expect(httpRequest(API_ROUTES.LOCATIONS)).resolves.toEqual({ ok: 1 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(authorization(fetchMock.mock.calls[1]!)).toBe('Bearer new');
  });

  it('propagates the failure when the refresh fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(401, { code: 'UNAUTHORIZED' })));
    refresh.mockRejectedValue(new Error('expired'));
    await expect(httpRequest(API_ROUTES.LOCATIONS)).rejects.toThrow('expired');
  });

  it('does not refresh on 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(403, { code: 'FORBIDDEN' })));
    await expect(httpRequest(API_ROUTES.LOCATIONS)).rejects.toMatchObject({ kind: 'forbidden' });
    expect(refresh).not.toHaveBeenCalled();
  });
});
