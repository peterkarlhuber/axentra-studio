import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setCsrfToken } from '@/api/csrf';
import type { Me } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { Route, Routes } from 'react-router';
import { jsonResponse, makeMe, mockApi, resetApi } from '@/features/billing/test-helpers';
import { createTestQueryClient, renderWithProviders, testMeta } from '@/test/utils';
import { ProductDetailPage } from './ProductDetailPage';

const PRODUCT_PERMS = [
  'product:read',
  'product:manage',
  'product_members:read',
  'product_members:manage',
  'roles:read',
];

const product = (extra: Record<string, unknown> = {}) => ({
  id: 'prd_1',
  name: 'CRM',
  slug: 'crm',
  description: 'Customer data',
  status: 'active',
  settings: { default_locale: 'de' },
  version: 3,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-02T00:00:00Z',
  ...extra,
});

/** A product owner of prd_1 (no platform role) unless `platformPermissions` are given. */
function owner(permissions = PRODUCT_PERMS, platformPermissions: string[] = []): Me {
  const base = makeMe(platformPermissions);
  return {
    ...base,
    platform_role: platformPermissions.length ? 'platform_admin' : null,
    products: [
      {
        product: { id: 'prd_1', name: 'CRM', slug: 'crm' },
        role: 'product_owner',
        permissions,
        tenants: [],
      },
    ],
  } as unknown as Me;
}

afterEach(() => {
  resetApi();
  setCsrfToken(null);
});

function render(
  me: Me,
  options: { product?: ReturnType<typeof product>; mode?: 'multi' | 'single' } = {},
) {
  let current = options.product ?? product();
  const calls = mockApi((request, url) => {
    const path = url.pathname;
    if (path === '/v1/products/prd_1' && request.method === 'GET') return jsonResponse(current);
    if (path === '/v1/products/prd_1' && request.method === 'PATCH') {
      return request.json().then((body: Record<string, unknown>) => {
        current = { ...current, ...body, version: current.version + 1 };
        return jsonResponse(current);
      });
    }
    if (path === '/v1/products/prd_1/archive') {
      current = { ...current, status: 'archived' };
      return jsonResponse(current);
    }
    if (path === '/v1/products/prd_1/members') return jsonResponse([]);
    if (path === '/v1/products/prd_1/invitations') return jsonResponse([]);
    if (path === '/v1/products/prd_1/roles') return jsonResponse([]);
    return undefined;
  }, me);
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(queryKeys.session, { csrf_token: 'csrf-1' });
  setCsrfToken('csrf-1');
  renderWithProviders(
    <Routes>
      <Route path="/products/:productId" element={<ProductDetailPage />} />
    </Routes>,
    { route: '/products/prd_1', queryClient, meta: { ...testMeta, mode: options.mode ?? 'multi' } },
  );
  return calls;
}

describe('ProductDetailPage', () => {
  it('shows the details and saves name, description and settings with the version', async () => {
    const calls = render(owner());
    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { level: 1, name: 'CRM' })).toBeInTheDocument();
    expect(screen.getByText('crm')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    const name = await screen.findByRole('textbox', { name: /^Name/ });
    await user.clear(name);
    await user.type(name, 'CRM Cloud');
    const settings = screen.getByRole('textbox', { name: /^Settings/ });
    await user.clear(settings);
    await user.type(settings, '{{"default_locale": "fr"}');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Product saved')).toBeInTheDocument();
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.body).toEqual({
      name: 'CRM Cloud',
      description: 'Customer data',
      settings: { default_locale: 'fr' },
    });
    expect(patch?.headers.get('If-Match')).toBe('3');
  });

  it('refuses settings that are not a JSON object without a request', async () => {
    const calls = render(owner());
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Settings' }));
    const settings = await screen.findByRole('textbox', { name: /^Settings/ });
    await user.clear(settings);
    await user.type(settings, '[[1]');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(/Settings must be a JSON object/)).toBeInTheDocument();
    await user.clear(settings);
    await user.type(settings, '{{');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('This is not valid JSON.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  it('shows the settings read-only without product:manage', async () => {
    render(owner(['product:read', 'product_members:read']));
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Settings' }));
    expect(
      await screen.findByText('You can view but not change these settings.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^Name/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('archives after confirming the product name (platform admin, multi-product mode)', async () => {
    const calls = render(owner(PRODUCT_PERMS, ['products:archive']));
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Archive' }));
    const dialog = await screen.findByRole('dialog', { name: 'Archive product?' });
    const confirm = within(dialog).getByRole('button', { name: 'Archive' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole('textbox'), 'CRM');
    await user.click(confirm);
    expect(await screen.findByText('Product archived')).toBeInTheDocument();
    expect(calls.some((call) => call.path === '/v1/products/prd_1/archive')).toBe(true);
  });

  it('offers no archive in single-product mode and explains why', async () => {
    render(owner(PRODUCT_PERMS, ['products:archive']), { mode: 'single' });
    expect(await screen.findByText(/single-product mode/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
  });

  it('has members and invitations tabs for the product team', async () => {
    const calls = render(owner());
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Invitations' }));
    expect(await screen.findByText('No invitations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite member' })).toBeInTheDocument();
    await waitFor(() =>
      expect(calls.some((call) => call.path === '/v1/products/prd_1/invitations')).toBe(true),
    );
    await user.click(screen.getByRole('tab', { name: 'Members' }));
    expect(await screen.findByText('No members yet')).toBeInTheDocument();
  });

  it('hides the team tabs without product_members:read', async () => {
    render(owner(['product:read']));
    expect(await screen.findByRole('tab', { name: 'Details' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Members' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Invitations' })).not.toBeInTheDocument();
  });

  it('shows an archived product read-only, without inviting', async () => {
    render(owner(), { product: product({ status: 'archived' }) });
    const user = userEvent.setup();
    expect(await screen.findByText(/This product is archived/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Invitations' }));
    expect(await screen.findByText('No invitations')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Invite member' })).not.toBeInTheDocument();
  });
});
