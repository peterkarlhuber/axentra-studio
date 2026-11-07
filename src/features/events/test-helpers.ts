/**
 * Shared fixtures for the Events & Jobs page tests: a fetch mock at the client boundary
 * (like the other Studio tests) and a renderer with the product scope.
 */
import { createElement, type ReactElement } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { configureApi } from '@/api/client';
import type { Me, ProductAccess } from '@/api/models';
import { ProductScopeContext } from '@/app/contexts';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';

export const PID = 'prd_1';
export const API = 'http://axentra.test';

export const ALL_PERMISSIONS = [
  'jobs:read',
  'jobs:manage',
  'webhooks:read',
  'webhooks:manage',
  'events:publish',
  'tenants:read',
];

export function makeMe(permissions: string[] = ALL_PERMISSIONS): Me {
  return {
    user: {
      id: 'usr_1',
      email: 'ada@example.com',
      name: 'Ada',
      status: 'active',
      locale: 'en',
      preferences: {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      has_password: true,
      platform_role: null,
    },
    actor_kind: 'user',
    platform_role: null,
    platform_permissions: [],
    products: [
      {
        product: {
          id: PID,
          slug: 'demo',
          name: 'Demo',
          description: '',
          status: 'active',
          settings: {},
          version: 1,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        role: 'product_admin',
        permissions,
        tenants: [],
      },
    ],
  } as unknown as Me;
}

export interface Call {
  method: string;
  path: string;
  search: URLSearchParams;
  headers: Headers;
  body: unknown;
}

type Handler = (call: Call) => Response | undefined | Promise<Response | undefined>;

/** Route API requests to `handler`; session, me and tenants have defaults. */
export function mockApi(
  handler: Handler,
  options: { permissions?: string[]; tenants?: unknown[]; role?: string | null } = {},
) {
  const calls: Call[] = [];
  const me = makeMe(options.permissions);
  if (options.tenants) (me.products[0] as { tenants: unknown[] }).tenants = options.tenants;
  if (options.role !== undefined) (me.products[0] as { role: string | null }).role = options.role;
  configureApi({
    baseUrl: API,
    fetch: async (request: Request) => {
      const url = new URL(request.url);
      const text = request.method === 'GET' ? '' : await request.clone().text();
      const call: Call = {
        method: request.method,
        path: url.pathname,
        search: url.searchParams,
        headers: request.headers,
        body: text ? (JSON.parse(text) as unknown) : undefined,
      };
      calls.push(call);
      const answer = await handler(call);
      if (answer) return answer;
      if (url.pathname === '/v1/auth/session') return jsonResponse({ csrf_token: 'csrf-1' });
      if (url.pathname === '/v1/me') return jsonResponse(me);
      if (url.pathname === `/v1/products/${PID}/tenants`) {
        return jsonResponse({ items: [{ id: 'ten_1', name: 'Acme' }], next_cursor: null });
      }
      return jsonResponse(
        { code: 'not_found', status: 404, detail: `unmocked ${call.method} ${call.path}` },
        { status: 404 },
      );
    },
  });
  return { calls, me };
}

export const page = <T>(items: T[], next_cursor: string | null = null) =>
  jsonResponse({ items, next_cursor });

function LocationProbe() {
  const location = useLocation();
  return createElement('p', { 'data-testid': 'location' }, location.pathname + location.search);
}

/** Render a page at `route` matched by `path`, inside the product scope. */
export function renderPage(
  element: ReactElement,
  { route, path, modules }: { route: string; path: string; modules?: string[] },
) {
  const access = undefined as ProductAccess | undefined;
  const scoped = createElement(
    ProductScopeContext.Provider,
    { value: { productId: PID, product: undefined, access } },
    element,
  );
  return renderWithProviders(
    createElement(
      Routes,
      null,
      createElement(Route, { path, element: scoped }),
      createElement(Route, { path: '*', element: createElement(LocationProbe) }),
    ),
    {
      route,
      meta: { ...testMeta, modules: modules ?? [...testMeta.modules, 'events'] },
    },
  );
}

export const baseJob = {
  id: 'job_1',
  product_id: PID,
  tenant_id: null,
  kind: 'reports.send',
  payload: { report: 'monthly', token: '[redacted]' },
  status: 'dead',
  priority: 0,
  run_after: '2026-10-01T10:00:00Z',
  attempts: 5,
  max_attempts: 5,
  lease_until: null,
  worker: 'host-1:123',
  cancel_requested: false,
  last_error: 'RuntimeError: upstream said no (token=[redacted])',
  idempotency_key: 'k-1',
  result: null,
  schedule_id: null,
  created_by: 'usr_1',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:05:00Z',
  started_at: '2026-10-01T10:00:01Z',
  finished_at: '2026-10-01T10:05:00Z',
} as const;
