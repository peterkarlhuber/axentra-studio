import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Me } from '@/api/models';
import {
  jsonResponse,
  makeMe,
  mockApi,
  PRODUCT_ID,
  renderProductPage,
  resetApi,
  subscriptionFixture,
  TENANT_ID,
} from '@/features/billing/test-helpers';
import { TenantBillingPage } from '@/features/billing/TenantBillingPage';
import { InvitationsPage } from './InvitationsPage';
import { SuspendedTenantGate } from './SuspendedTenantGate';

const tenantUrl = `/v1/products/${PRODUCT_ID}/tenants/${TENANT_ID}`;
const tenant = (status: 'active' | 'suspended') => ({
  id: TENANT_ID,
  product_id: PRODUCT_ID,
  slug: 'acme',
  name: 'Acme',
  status,
  version: 2,
  settings: {},
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-02T00:00:00Z',
});

/** A product operator who is not a platform admin. */
function operator(permissions: string[]): Me {
  return {
    ...makeMe([]),
    platform_role: null,
    platform_permissions: [],
    products: [
      {
        product: { id: PRODUCT_ID, name: 'CRM', slug: 'crm', status: 'active' },
        role: 'product_owner',
        permissions,
        tenants: [],
      },
    ],
  } as unknown as Me;
}

const OWNER = ['tenants:read', 'tenants:update', 'billing:read', 'billing:manage', 'members:read'];
const VIEWER = ['tenants:read', 'billing:read', 'members:read'];

/** Answers the tenant record and a list; any request below the tenant is tenant data. */
function api(status: 'active' | 'suspended', me: Me) {
  return mockApi((_request, url) => {
    if (url.pathname === tenantUrl) return jsonResponse(tenant(status));
    if (url.pathname === `/v1/products/${PRODUCT_ID}/tenants`)
      return jsonResponse({ items: [tenant(status)], next_cursor: null });
    if (url.pathname === `${tenantUrl}/billing/subscription`)
      return jsonResponse(subscriptionFixture);
    if (url.pathname.startsWith(`${tenantUrl}/`)) return jsonResponse([]);
    return undefined;
  }, me);
}

const dataCalls = (calls: { path: string }[]) =>
  calls.filter((call) => call.path.startsWith(`${tenantUrl}/`));

function renderGate() {
  return renderProductPage(
    <SuspendedTenantGate productId={PRODUCT_ID} tenantId={TENANT_ID} permission="billing:read">
      <p>tenant data</p>
    </SuspendedTenantGate>,
    { route: '/gate', path: '/gate' },
  );
}

afterEach(resetApi);

describe('SuspendedTenantGate', () => {
  it('renders the screen for an active tenant', async () => {
    api('active', operator(VIEWER));
    renderGate();
    expect(await screen.findByText('tenant data')).toBeInTheDocument();
  });

  it('explains a suspended tenant to a product owner and links to the tenant page', async () => {
    api('suspended', operator(OWNER));
    renderGate();
    expect(
      await screen.findByRole('heading', { name: 'Not available while the tenant is suspended' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/“Acme” is suspended/)).toBeInTheDocument();
    expect(await screen.findByText(/Reactivate the tenant on its page/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the tenant' })).toHaveAttribute(
      'href',
      `/p/${PRODUCT_ID}/tenants/${TENANT_ID}`,
    );
    expect(screen.queryByText('tenant data')).not.toBeInTheDocument();
  });

  it('tells a viewer who can reactivate it', async () => {
    api('suspended', operator(VIEWER));
    renderGate();
    expect(
      await screen.findByText(/A product owner or admin can reactivate it\./),
    ).toBeInTheDocument();
  });

  it('lets a platform role through without reading the tenant first', async () => {
    const calls = api('suspended', makeMe(['billing:read', 'tenants:read']));
    renderGate();
    expect(await screen.findByText('tenant data')).toBeInTheDocument();
    expect(calls.some((call) => call.path === tenantUrl)).toBe(false);
  });

  it('falls back to the screen when the tenant record cannot be read', async () => {
    mockApi(
      (_request, url) =>
        url.pathname === tenantUrl
          ? jsonResponse({ code: 'forbidden', status: 403 }, { status: 403 })
          : undefined,
      operator([]),
    );
    renderGate();
    expect(await screen.findByText('tenant data')).toBeInTheDocument();
  });
});

describe('tenant-scoped pages of a suspended tenant', () => {
  it('subscription page: explains instead of "Not permitted" and sends no billing request', async () => {
    const calls = api('suspended', operator(OWNER));
    renderProductPage(<TenantBillingPage />, {
      route: `/p/${PRODUCT_ID}/subscriptions/${TENANT_ID}`,
      path: '/p/:productId/subscriptions/:tenantId',
    });
    expect(
      await screen.findByRole('heading', { name: 'Not available while the tenant is suspended' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Acme' })).toBeInTheDocument();
    expect(screen.queryByText('Not permitted')).not.toBeInTheDocument();
    expect(dataCalls(calls)).toEqual([]);
  });

  it('subscription page: an active tenant still loads its subscription', async () => {
    const calls = api('active', operator(OWNER));
    renderProductPage(<TenantBillingPage />, {
      route: `/p/${PRODUCT_ID}/subscriptions/${TENANT_ID}`,
      path: '/p/:productId/subscriptions/:tenantId',
    });
    await waitFor(() =>
      expect(dataCalls(calls).some((call) => call.path.endsWith('/billing/subscription'))).toBe(
        true,
      ),
    );
    expect(
      screen.queryByRole('heading', { name: 'Not available while the tenant is suspended' }),
    ).not.toBeInTheDocument();
  });

  it('invitations page: explains the suspension for the chosen tenant', async () => {
    const calls = api('suspended', operator(OWNER));
    renderProductPage(<InvitationsPage />, {
      route: `/p/${PRODUCT_ID}/invitations?tenant=${TENANT_ID}`,
      path: '/p/:productId/invitations',
    });
    expect(
      await screen.findByRole('heading', { name: 'Not available while the tenant is suspended' }),
    ).toBeInTheDocument();
    expect(dataCalls(calls)).toEqual([]);
  });
});
