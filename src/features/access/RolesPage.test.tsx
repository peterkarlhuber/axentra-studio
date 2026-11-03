import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setCsrfToken } from '@/api/csrf';
import {
  PRODUCT_ID,
  jsonResponse,
  makeMe,
  mockApi,
  renderProductPage,
  resetApi,
} from '@/features/billing/test-helpers';
import { RolesPage } from './RolesPage';

const PERMISSIONS = [
  { name: 'records:read', scope: 'tenant', description: 'Read records', source: 'builtin' },
  { name: 'records:write', scope: 'tenant', description: 'Write records', source: 'builtin' },
  { name: 'tenants:read', scope: 'product', description: 'Read tenants', source: 'builtin' },
];
const BUILTIN = {
  key: 'member',
  name: 'Member',
  scope: 'tenant',
  builtin: true,
  description: 'Uses the tenant',
  permissions: ['records:read', 'records:write'],
};
const CUSTOM = {
  id: 'rol_1',
  key: 'support_agent',
  name: 'Support agent',
  scope: 'tenant',
  builtin: false,
  description: '',
  permissions: ['records:read'],
  version: 4,
};

afterEach(() => {
  resetApi();
  setCsrfToken(null);
});

function api(permissions: string[], extra?: (request: Request, url: URL) => Response | undefined) {
  const base = `/v1/products/${PRODUCT_ID}/roles`;
  const calls = mockApi((request, url) => {
    const answer = extra?.(request, url);
    if (answer) return answer;
    if (url.pathname === base && request.method === 'GET') return jsonResponse([BUILTIN, CUSTOM]);
    if (url.pathname === `/v1/products/${PRODUCT_ID}/permissions`) return jsonResponse(PERMISSIONS);
    return undefined;
  }, makeMe(permissions));
  renderProductPage(<RolesPage />, {
    route: `/p/${PRODUCT_ID}/roles`,
    path: '/p/:productId/roles',
  });
  return calls;
}

describe('RolesPage', () => {
  it('shows built-in role descriptions in the interface language, custom ones as entered', async () => {
    api(['roles:read']);
    // The server's English text ("Uses the tenant") is replaced by Studio's translation by key.
    expect(await screen.findByText("Works with the tenant's data")).toBeInTheDocument();
    expect(screen.queryByText('Uses the tenant')).not.toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('creates a tenant role with a key derived from the name', async () => {
    const calls = api(['roles:read', 'roles:manage'], (request, url) =>
      request.method === 'POST' && url.pathname.endsWith('/roles')
        ? jsonResponse(
            { ...CUSTOM, id: 'rol_2', key: 'billing_clerk', name: 'Billing clerk' },
            { status: 201 },
          )
        : undefined,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'New custom role' }));
    const dialog = await screen.findByRole('dialog', { name: 'New custom role' });
    await user.type(within(dialog).getByRole('textbox', { name: /^Name/ }), 'Billing clerk');
    expect(within(dialog).getByRole('textbox', { name: /^Key/ })).toHaveValue('billing_clerk');
    // A tenant role offers only tenant permissions.
    expect(
      within(dialog).queryByRole('checkbox', { name: /tenants:read/ }),
    ).not.toBeInTheDocument();
    await user.click(await within(dialog).findByRole('checkbox', { name: /records:write/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Role “Billing clerk” created')).toBeInTheDocument();
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.body).toEqual({
      name: 'Billing clerk',
      description: '',
      permissions: ['records:write'],
      key: 'billing_clerk',
      scope: 'tenant',
    });
  });

  it('edits a custom role with If-Match and explains a concurrent change', async () => {
    const calls = api(['roles:read', 'roles:manage'], (request) =>
      request.method === 'PATCH'
        ? jsonResponse(
            { code: 'precondition_failed', status: 412, request_id: 'r-412' },
            { status: 412 },
          )
        : undefined,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Edit role Support agent' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit role Support agent' });
    await user.click(await within(dialog).findByRole('checkbox', { name: /records:write/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'PATCH')).toBe(true));
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.headers.get('If-Match')).toBe('4');
    expect(patch?.body).toMatchObject({ permissions: ['records:read', 'records:write'] });
    expect((await screen.findAllByText(/someone else|changed/i)).length).toBeGreaterThan(0);
    expect(dialog).toBeInTheDocument();
  });

  it('deletes a custom role only after typing its name', async () => {
    const calls = api(['roles:read', 'roles:manage'], (request) =>
      request.method === 'DELETE' ? new Response(null, { status: 204 }) : undefined,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Delete role Support agent' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete role?' });
    const confirm = within(dialog).getByRole('button', { name: 'Delete role' });
    expect(confirm).toBeDisabled();
    await user.type(
      within(dialog).getByRole('textbox', { name: /Type Support agent/ }),
      'Support agent',
    );
    await user.click(confirm);
    expect(await screen.findByText('Role “Support agent” deleted')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'DELETE')?.path).toBe(
      `/v1/products/${PRODUCT_ID}/roles/rol_1`,
    );
  });

  it('is read-only without roles:manage, and built-in roles are always read-only', async () => {
    api(['roles:read']);
    const user = userEvent.setup();
    expect(await screen.findByText('Support agent')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New custom role' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit role/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View role Member' }));
    const dialog = await screen.findByRole('dialog', { name: 'Member' });
    expect(within(dialog).getByText('Built-in roles cannot be changed.')).toBeInTheDocument();
    expect(within(dialog).getByText('records:write')).toBeInTheDocument();
  });
});
