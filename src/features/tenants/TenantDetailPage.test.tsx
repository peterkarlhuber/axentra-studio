import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Me } from '@/api/models';
import {
  jsonResponse,
  makeMe,
  mockApi,
  PRODUCT_ID,
  renderProductPage,
  resetApi,
  TENANT_ID,
} from '@/features/billing/test-helpers';
import { TenantDetailPage } from './TenantDetailPage';
import { TenantsPage } from './TenantsPage';

const tenantUrl = `/v1/products/${PRODUCT_ID}/tenants/${TENANT_ID}`;
const suspendedTenant = {
  id: TENANT_ID,
  product_id: PRODUCT_ID,
  slug: 'acme',
  name: 'Acme',
  status: 'suspended',
  version: 4,
  member_count: 2,
  settings: {},
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-02T00:00:00Z',
};

const OWNER_PERMISSIONS = [
  'product:read',
  'tenants:read',
  'tenants:create',
  'tenants:update',
  'tenants:delete',
  'tenant:read',
  'members:read',
  'members:manage',
  'records:read',
];
const VIEWER_PERMISSIONS = ['product:read', 'tenants:read', 'tenant:read', 'members:read'];

/** A product operator who is not a platform admin. */
function operator(permissions: string[], role = 'product_owner'): Me {
  return {
    ...makeMe([]),
    platform_role: null,
    platform_permissions: [],
    products: [
      {
        product: { id: PRODUCT_ID, name: 'CRM', slug: 'crm', status: 'active' },
        role,
        permissions,
        tenants: [],
      },
    ],
  } as unknown as Me;
}

function api(me: Me, patch?: (request: Request) => Response | Promise<Response>) {
  let tenant = { ...suspendedTenant };
  const calls = mockApi((request, url) => {
    if (url.pathname === tenantUrl && request.method === 'GET') return jsonResponse(tenant);
    if (url.pathname === tenantUrl && request.method === 'PATCH') {
      if (patch) return patch(request);
      return request.json().then((body: { status: string }) => {
        tenant = { ...tenant, status: body.status, version: tenant.version + 1 };
        return jsonResponse(tenant);
      });
    }
    if (url.pathname === `/v1/products/${PRODUCT_ID}/tenants`)
      return jsonResponse({ items: [tenant], next_cursor: null });
    // Members and invitations: only platform roles reach them while the tenant is suspended.
    if (url.pathname.startsWith(`${tenantUrl}/`)) return jsonResponse([]);
    if (url.pathname === `/v1/products/${PRODUCT_ID}/roles`) return jsonResponse([]);
    return undefined;
  }, me);
  return calls;
}

const renderDetail = () =>
  renderProductPage(<TenantDetailPage />, {
    route: `/p/${PRODUCT_ID}/tenants/${TENANT_ID}`,
    path: '/p/:productId/tenants/:tenantId',
  });

afterEach(resetApi);

describe('TenantDetailPage for a suspended tenant', () => {
  it('lets a product owner reactivate it after a confirmation, without touching tenant data', async () => {
    const calls = api(operator(OWNER_PERMISSIONS));
    const user = userEvent.setup();
    renderDetail();

    expect(await screen.findByText('This tenant is suspended')).toBeInTheDocument();
    expect(
      await screen.findByText(/Reactivate the tenant to restore access\./),
    ).toBeInTheDocument();
    // Records of a suspended tenant cannot be browsed.
    expect(screen.queryByRole('link', { name: 'Browse records' })).not.toBeInTheDocument();

    // The members tab explains instead of failing with 403.
    await user.click(await screen.findByRole('tab', { name: 'Members' }));
    expect(
      await screen.findByRole('heading', { name: 'Not available while the tenant is suspended' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Invitations' }));
    expect(
      await screen.findByRole('heading', { name: 'Not available while the tenant is suspended' }),
    ).toBeInTheDocument();
    expect(calls.some((call) => call.path.startsWith(`${tenantUrl}/`))).toBe(false);

    // Header action (the tab panel offers the same one) -> confirmation -> PATCH with the version.
    await user.click(screen.getByRole('tab', { name: 'Details' }));
    await user.click(screen.getByRole('button', { name: 'Reactivate tenant' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reactivate tenant?' });
    expect(within(dialog).getByText(/regain access immediately/)).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    await user.click(within(dialog).getByRole('button', { name: 'Reactivate tenant' }));

    expect(await screen.findByText('Tenant reactivated')).toBeInTheDocument();
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.body).toEqual({ status: 'active' });
    expect(patch?.headers.get('If-Match')).toBe('4');
    await waitFor(() =>
      expect(screen.queryByText('This tenant is suspended')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Suspend tenant' })).toBeInTheDocument();
  });

  it('shows no reactivate action to an operator without tenants:update', async () => {
    api(operator(VIEWER_PERMISSIONS, 'product_viewer'));
    const user = userEvent.setup();
    renderDetail();
    expect(await screen.findByText('This tenant is suspended')).toBeInTheDocument();
    expect(screen.getByText(/A product owner or admin can reactivate it\./)).toBeInTheDocument();
    await user.click(await screen.findByRole('tab', { name: 'Members' }));
    expect(
      await screen.findByText(/A product owner or admin can reactivate the tenant\./),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reactivate tenant' })).not.toBeInTheDocument();
  });

  it('keeps the dialog open and explains a refused reactivation', async () => {
    api(operator(OWNER_PERMISSIONS), () =>
      jsonResponse(
        {
          code: 'precondition_failed',
          status: 412,
          title: 'Precondition failed',
          detail: 'the tenant was changed by someone else',
          request_id: 'req-412',
        },
        { status: 412 },
      ),
    );
    const user = userEvent.setup();
    renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Reactivate tenant' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reactivate tenant?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reactivate tenant' }));
    expect(await screen.findByText(/req-412/)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Reactivate tenant?' })).toBeInTheDocument();
    expect(screen.queryByText('Tenant reactivated')).not.toBeInTheDocument();
  });

  it('still shows the data panels to a platform admin', async () => {
    const calls = api(makeMe(['tenants:read', 'tenants:update', 'members:read', 'members:manage']));
    const user = userEvent.setup();
    renderDetail();
    expect(await screen.findByText('This tenant is suspended')).toBeInTheDocument();
    expect(await screen.findByText(/your platform role still can/)).toBeInTheDocument();
    await user.click(await screen.findByRole('tab', { name: 'Members' }));
    await waitFor(() =>
      expect(calls.some((call) => call.path === `${tenantUrl}/members`)).toBe(true),
    );
    expect(
      screen.queryByRole('heading', { name: 'Not available while the tenant is suspended' }),
    ).not.toBeInTheDocument();
  });
});

describe('TenantsPage', () => {
  it('offers Reactivate in the row menu of a suspended tenant', async () => {
    const calls = api(operator(OWNER_PERMISSIONS));
    const user = userEvent.setup();
    renderProductPage(<TenantsPage />, {
      route: `/p/${PRODUCT_ID}/tenants?status=suspended`,
      path: '/p/:productId/tenants',
    });
    expect(await screen.findByRole('link', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('suspended');
    expect(
      calls.some(
        (call) =>
          call.path === `/v1/products/${PRODUCT_ID}/tenants` &&
          call.url.searchParams.get('status') === 'suspended',
      ),
    ).toBe(true);
    await user.click(await screen.findByRole('button', { name: 'Actions for Acme' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Reactivate tenant' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reactivate tenant?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reactivate tenant' }));
    expect(await screen.findByText('Tenant reactivated')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ status: 'active' });
  });

  it('has no row menu without tenants:update', async () => {
    const calls = api(operator(VIEWER_PERMISSIONS, 'product_viewer'));
    renderProductPage(<TenantsPage />, {
      route: `/p/${PRODUCT_ID}/tenants`,
      path: '/p/:productId/tenants',
    });
    await waitFor(() => expect(calls.some((call) => call.path === '/v1/me')).toBe(true));
    expect(await screen.findByRole('link', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for Acme' })).not.toBeInTheDocument();
  });
});
