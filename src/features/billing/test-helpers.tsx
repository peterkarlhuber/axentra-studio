/* Test-only helpers for the usage and billing screens (not imported by app code). */
import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router';
import { configureApi } from '@/api/client';
import type { Me, Meta } from '@/api/models';
import { ProductScopeContext } from '@/app/contexts';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';

export const PRODUCT_ID = 'prd_1';
export const TENANT_ID = 'ten_1';

export const ALL_MODULES_META: Meta = {
  ...testMeta,
  modules: [...testMeta.modules, 'usage', 'billing'],
};

export const ADMIN_PERMISSIONS = [
  'usage:read',
  'usage:manage',
  'usage:record',
  'billing:read',
  'billing:manage',
  'tenants:read',
  'product:manage',
  'platform:settings',
];

export function makeMe(permissions: string[] = ADMIN_PERMISSIONS): Me {
  return {
    user: {
      id: 'usr_1',
      email: 'admin@example.com',
      name: 'Admin',
      status: 'active',
      locale: 'en',
      preferences: {},
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
      last_login_at: null,
      has_password: true,
      platform_role: 'platform_admin',
    },
    actor_kind: 'user',
    platform_role: 'platform_admin',
    platform_permissions: permissions,
    products: [],
  } as unknown as Me;
}

export type Handler = (request: Request, url: URL) => Response | Promise<Response> | undefined;

/**
 * Mock fetch at the client boundary. `handler` answers API calls; session and `/v1/me` are
 * answered here unless the handler does. Unknown calls get a 404 problem so tests notice them.
 */
export function mockApi(handler: Handler, me: Me = makeMe()) {
  const calls: { method: string; path: string; url: URL; body: unknown; headers: Headers }[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      const url = new URL(request.url);
      const text = request.method === 'GET' ? '' : await request.clone().text();
      calls.push({
        method: request.method,
        path: url.pathname,
        url,
        body: text ? JSON.parse(text) : undefined,
        headers: request.headers,
      });
      const answer = await handler(request, url);
      if (answer) return answer;
      if (url.pathname === '/v1/auth/session') return jsonResponse({ csrf_token: 'csrf-1' });
      if (url.pathname === '/v1/me') return jsonResponse(me);
      return jsonResponse(
        { code: 'not_found', status: 404, title: 'Not found', request_id: 'req-test' },
        { status: 404 },
      );
    },
  });
  return calls;
}

export function resetApi() {
  configureApi({ baseUrl: '' });
}

/** Render a product-scoped page at `route`, matching `path` (e.g. `/p/:productId/usage`). */
export function renderProductPage(
  page: ReactElement,
  { route, path, meta = ALL_MODULES_META }: { route: string; path: string; meta?: Meta },
) {
  return renderWithProviders(
    <ProductScopeContext.Provider
      value={{ productId: PRODUCT_ID, product: undefined, access: undefined }}
    >
      <Routes>
        <Route path={path} element={page} />
        <Route path="*" element={<p>other page</p>} />
      </Routes>
    </ProductScopeContext.Provider>,
    { route, meta },
  );
}

export { jsonResponse };

export const meterFixture = {
  id: 'mtr_1',
  product_id: PRODUCT_ID,
  key: 'api_calls',
  name: 'API calls',
  unit: 'calls',
  aggregation: 'sum',
  reset_period: 'month',
  description: '',
  default_limit: 100,
  default_enforcement: 'hard',
  active: true,
  version: 3,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

export const planFixture = {
  id: 'pln_1',
  product_id: PRODUCT_ID,
  key: 'pro',
  name: 'Pro',
  description: '',
  active: true,
  trial_days: 14,
  prices: [
    {
      id: 'prc_1',
      amount_minor: 1900,
      currency: 'EUR',
      interval: 'month',
      provider_price_id: null,
    },
  ],
  free: false,
  entitlements: { 'feature.sso': true, 'limit.api_calls': 1000 },
  version: 2,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

export const subscriptionFixture = {
  id: 'sub_1',
  product_id: PRODUCT_ID,
  tenant_id: TENANT_ID,
  plan_id: 'pln_1',
  plan_key: 'pro',
  status: 'trialing',
  price: planFixture.prices[0],
  current_period_start: '2026-11-01T00:00:00Z',
  current_period_end: '2099-11-15T00:00:00Z',
  trial_end: '2099-11-15T00:00:00Z',
  cancel_at_period_end: false,
  canceled_at: null,
  provider: 'manual',
  provider_customer_id: null,
  provider_subscription_id: null,
  version: 4,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
};

export const tenantPage = {
  items: [
    {
      id: TENANT_ID,
      product_id: PRODUCT_ID,
      slug: 'acme',
      name: 'Acme',
      status: 'active',
      version: 1,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
  ],
  next_cursor: null,
};

export function settingsFixture(provider = 'manual', livePayments = false) {
  return { billing: { provider, live_payments: livePayments }, modules: [] };
}
