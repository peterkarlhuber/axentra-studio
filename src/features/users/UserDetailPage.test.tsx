import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import type { Me } from '@/api/models';
import { jsonResponse, makeMe, mockApi, resetApi } from '@/features/billing/test-helpers';
import { renderWithProviders } from '@/test/utils';
import { UserDetailPage } from './UserDetailPage';

const USER_ID = 'usr_ada';
const userUrl = `/v1/users/${USER_ID}`;
const ada = {
  id: USER_ID,
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  status: 'active',
  locale: 'en',
  preferences: {},
  platform_role: null,
  has_password: true,
  last_login_at: '2026-11-01T10:00:00Z',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};
const adaSession = {
  id: 'ses_1',
  current: false,
  user_agent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0',
  ip: '203.0.113.7',
  created_at: '2026-11-01T10:00:00Z',
  last_seen_at: '2026-11-01T11:00:00Z',
  expires_at: '2026-11-08T10:00:00Z',
};

const adaMemberships = {
  products: [
    {
      product_id: 'prd_1',
      product_slug: 'crm',
      product_name: 'CRM',
      role: 'product_admin',
      created_at: '2026-10-02T00:00:00Z',
    },
  ],
  tenants: [
    {
      product_id: 'prd_1',
      product_slug: 'crm',
      product_name: 'CRM',
      tenant_id: 'ten_1',
      tenant_slug: 'acme',
      tenant_name: 'Acme',
      tenant_status: 'suspended',
      role: 'viewer',
      created_at: '2026-10-03T00:00:00Z',
    },
  ],
};

/** `signedInAs`: the id of the signed-in user (the page hides "Disable" for oneself). */
function api({
  me = makeMe(['users:read', 'users:manage']),
  signedInAs = 'usr_1',
  memberships = adaMemberships,
} = {}) {
  let user = { ...ada };
  return mockApi((request, url) => {
    if (url.pathname === '/v1/auth/session')
      return jsonResponse({ csrf_token: 'csrf-1', user: { id: signedInAs } });
    if (url.pathname === userUrl && request.method === 'GET') return jsonResponse(user);
    if (url.pathname === userUrl && request.method === 'PATCH') {
      return request.json().then((body: { status: string }) => {
        user = { ...user, status: body.status };
        return jsonResponse(user);
      });
    }
    if (url.pathname === `${userUrl}/sessions`) return jsonResponse([adaSession]);
    if (url.pathname === `${userUrl}/sessions/revoke`) return jsonResponse({ revoked: 1 });
    if (url.pathname === `${userUrl}/memberships`) return jsonResponse(memberships);
    return undefined;
  }, me);
}

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/users/:userId" element={<UserDetailPage />} />
    </Routes>,
    { route: `/users/${USER_ID}` },
  );

afterEach(resetApi);

describe('UserDetailPage', () => {
  it('shows the profile and the sessions of the user', async () => {
    api();
    renderPage();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(await screen.findByText(/203\.0\.113\.7/)).toBeInTheDocument();
  });

  it('lists the product roles and tenant memberships with links to manage them', async () => {
    api();
    renderPage();
    const products = await screen.findByRole('table', { name: 'Product roles' });
    expect(await within(products).findByRole('link', { name: 'CRM' })).toHaveAttribute(
      'href',
      '/products/prd_1',
    );
    expect(within(products).getByText('product_admin')).toBeInTheDocument();
    const tenants = screen.getByRole('table', { name: 'Tenant memberships' });
    expect(within(tenants).getByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      '/p/prd_1/tenants/ten_1',
    );
    expect(within(tenants).getByText('viewer')).toBeInTheDocument();
    expect(within(tenants).getByText('Suspended')).toBeInTheDocument();
  });

  it('says when no memberships are visible', async () => {
    api({ me: makeMe(['users:read']), memberships: { products: [], tenants: [] } });
    renderPage();
    expect(await screen.findByText('No product roles you can see')).toBeInTheDocument();
    expect(screen.getByText('No tenant memberships you can see')).toBeInTheDocument();
  });

  it('disables a user only after typing the email address, then offers to enable', async () => {
    const calls = api();
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Disable user' }));
    const dialog = await screen.findByRole('dialog', { name: 'Disable user?' });
    // Axentra AX3-01: a disabled user's API keys are refused until the user is enabled again.
    expect(
      within(dialog).getByText(/API keys the user created stop working until the user is enabled/),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole('button', { name: 'Disable user' });
    expect(confirm).toBeDisabled();
    await user.type(
      within(dialog).getByRole('textbox', { name: /Type ada@example\.com to confirm/ }),
      'ada@example.com',
    );
    await user.click(confirm);

    expect(await screen.findByText('User disabled')).toBeInTheDocument();
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.path).toBe(userUrl);
    expect(patch?.body).toEqual({ status: 'disabled' });
    expect(screen.getByText('This user is disabled and cannot sign in.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enable user' }));
    expect(await screen.findByText('User enabled')).toBeInTheDocument();
    expect(calls.filter((call) => call.method === 'PATCH').at(-1)?.body).toEqual({
      status: 'active',
    });
  });

  it('signs the user out everywhere after a confirmation', async () => {
    const calls = api();
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Sign out everywhere' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sign out everywhere?' });
    expect(calls.some((call) => call.path.endsWith('/sessions/revoke'))).toBe(false);
    await user.click(within(dialog).getByRole('button', { name: 'Sign out everywhere' }));
    expect(await screen.findByText('1 session revoked')).toBeInTheDocument();
    expect(
      calls.filter((call) => call.method === 'POST' && call.path === `${userUrl}/sessions/revoke`),
    ).toHaveLength(1);
  });

  it('does not offer to disable oneself', async () => {
    api({ signedInAs: USER_ID });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Sign out everywhere' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disable user' })).not.toBeInTheDocument();
  });

  it('is read-only without users:manage and does not load sessions', async () => {
    const reader = { ...makeMe(['users:read']), platform_role: 'platform_support' } as Me;
    const calls = api({ me: reader });
    renderPage();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disable user' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out everywhere' })).not.toBeInTheDocument();
    await waitFor(() => expect(calls.some((call) => call.path === '/v1/me')).toBe(true));
    expect(calls.some((call) => call.path === `${userUrl}/sessions`)).toBe(false);
  });

  it('shows a missing user as the page itself, with a page heading', async () => {
    mockApi(() => undefined, makeMe(['users:read', 'users:manage']));
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'Not found' })).toBeInTheDocument();
  });
});
