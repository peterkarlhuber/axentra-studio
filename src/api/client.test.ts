import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/utils';
import { CLIENT_HEADER, configureApi, onUnauthenticated, unwrap, api } from './client';
import { setCsrfToken } from './csrf';
import { ApiError } from './errors';
import { authApi, cleanQuery, asItems, metaApi, productsApi, recordsApi } from './endpoints';

const BASE = 'http://axentra.test';

function mockFetch(response: () => Response | Promise<Response>) {
  const calls: Request[] = [];
  const fetch = vi.fn(async (request: Request) => {
    calls.push(request);
    return response();
  });
  configureApi({ baseUrl: BASE, fetch });
  return { fetch, calls };
}

afterEach(() => {
  setCsrfToken(null);
  configureApi({ baseUrl: '' });
});

describe('API client', () => {
  it('sends credentials and the Axentra-Client header', async () => {
    const { calls } = mockFetch(() => jsonResponse([]));
    await productsApi.list();
    const request = calls[0] as Request;
    expect(request.url).toBe(`${BASE}/v1/products`);
    expect(request.credentials).toBe('include');
    expect(request.headers.get('Axentra-Client')).toBe(CLIENT_HEADER);
    expect(CLIENT_HEADER).toMatch(/^axentra-studio\/.+; api=1\.0$/);
  });

  it('adds the CSRF token to unsafe methods only', async () => {
    setCsrfToken('csrf-123');
    const { calls } = mockFetch(() => jsonResponse({ id: 'p1' }, { status: 201 }));
    await productsApi.list();
    await productsApi.create({ name: 'Shop', slug: 'shop', description: '' });
    expect(calls[0]?.headers.get('X-Axentra-CSRF')).toBeNull();
    expect(calls[1]?.method).toBe('POST');
    expect(calls[1]?.headers.get('X-Axentra-CSRF')).toBe('csrf-123');
  });

  it('omits the CSRF header when no token is known', async () => {
    const { calls } = mockFetch(() => jsonResponse({}));
    await authApi.logout();
    expect(calls[0]?.headers.get('X-Axentra-CSRF')).toBeNull();
  });

  it('notifies listeners on 401 from protected endpoints', async () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthenticated(listener);
    mockFetch(() => jsonResponse({ code: 'unauthenticated', status: 401 }, { status: 401 }));
    await expect(productsApi.list()).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('does not notify listeners for the session probe or a failed login', async () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthenticated(listener);
    mockFetch(() => jsonResponse({ code: 'unauthenticated' }, { status: 401 }));
    await expect(authApi.session()).rejects.toBeInstanceOf(ApiError);
    await expect(authApi.loginPassword({ email: 'a@b.c', password: 'x' })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('maps problem+json responses to ApiError', async () => {
    mockFetch(
      () =>
        new Response(
          JSON.stringify({
            type: 'urn:axentra:problem:conflict',
            title: 'Conflict',
            status: 409,
            code: 'conflict',
            detail: 'Slug already taken',
            request_id: 'req-1',
            errors: [{ loc: ['body', 'slug'], msg: 'taken' }],
          }),
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
    );
    const error = await productsApi
      .create({ name: 'A', slug: 'a', description: '' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'conflict',
      detail: 'Slug already taken',
      requestId: 'req-1',
    });
    expect((error as ApiError).errors).toHaveLength(1);
  });

  it('falls back to the status code and the X-Request-ID header', async () => {
    mockFetch(() => new Response('', { status: 404, headers: { 'X-Request-ID': 'hdr-7' } }));
    const error = await productsApi.get('missing').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 404, code: 'not_found', requestId: 'hdr-7' });
    expect((error as ApiError).isNotFound).toBe(true);
  });

  it('maps network failures to network_error', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(productsApi.list()).rejects.toMatchObject({ code: 'network_error', status: 0 });
  });

  it('treats a 503 health body as data', async () => {
    mockFetch(() =>
      jsonResponse({ status: 'unavailable', checks: { database: false } }, { status: 503 }),
    );
    await expect(metaApi.ready()).resolves.toEqual({
      status: 'unavailable',
      checks: { database: false },
    });
  });

  it('serializes the records `where` filter as JSON', async () => {
    const { calls } = mockFetch(() => jsonResponse({ items: [], next_cursor: null }));
    await recordsApi.list('p1', 't1', 'orders', { where: { status: 'open' }, sort: '-created_at' });
    const url = new URL((calls[0] as Request).url);
    expect(JSON.parse(url.searchParams.get('where') ?? '')).toEqual({ status: 'open' });
    expect(url.searchParams.get('sort')).toBe('-created_at');
  });

  it('unwrap returns data for successful calls', async () => {
    mockFetch(() => jsonResponse({ ok: true }));
    await expect(unwrap(api().GET('/v1/meta'))).resolves.toEqual({ ok: true });
  });
});

describe('endpoint helpers', () => {
  it('cleanQuery drops empty values', () => {
    expect(cleanQuery({ q: '', status: undefined, limit: 50, cursor: null, x: 0 })).toEqual({
      limit: 50,
      x: 0,
    });
  });

  it('asItems accepts pages and arrays', () => {
    expect(asItems([1, 2])).toEqual([1, 2]);
    expect(asItems({ items: [3], next_cursor: null })).toEqual([3]);
    expect(asItems(undefined)).toEqual([]);
  });
});
