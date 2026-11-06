import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import { meWith, mockApi, renderPage } from '@/features/storage/storage-test-utils';
import { jsonResponse } from '@/test/utils';
import { PermissionsPage } from './PermissionsPage';

afterEach(() => {
  configureApi({ baseUrl: '' });
  setCsrfToken(null);
});

const ACTIVE = [
  { name: 'records:read', scope: 'tenant', description: 'Read records', source: 'builtin' },
  {
    name: 'crm.deals:approve',
    scope: 'tenant',
    description: 'Approve deals',
    source: 'product',
    read_like: false,
    default_roles: ['member'],
    declared_by: 'code',
    retired_at: null,
  },
];
const RETIRED = {
  name: 'crm.old:thing',
  scope: 'product',
  description: 'Old',
  source: 'product',
  read_like: false,
  default_roles: [],
  declared_by: 'api',
  retired_at: '2026-11-01T10:00:00Z',
};

describe('PermissionsPage', () => {
  it('lists product and built-in permissions and shows retired ones on request', async () => {
    const calls = mockApi((_request, url) => {
      if (url.pathname === '/v1/products/prd_1/permissions') {
        return jsonResponse(
          url.searchParams.get('include_retired') === 'true' ? [...ACTIVE, RETIRED] : ACTIVE,
        );
      }
      return undefined;
    });
    renderPage(<PermissionsPage />, { me: meWith(['roles:read']), route: '/p/prd_1/permissions' });
    const own = await screen.findByRole('table', { name: 'Product permissions' });
    const row = await within(own).findByRole('row', { name: /crm\.deals:approve/ });
    expect(within(row).getByText('Approve deals')).toBeInTheDocument();
    expect(within(row).getByText('member')).toBeInTheDocument();
    expect(within(row).getByText('Product code')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
    const builtIn = screen.getByRole('table', { name: 'Built-in permissions' });
    expect(within(builtIn).getByText('records:read')).toBeInTheDocument();
    expect(within(builtIn).queryByText('crm.deals:approve')).not.toBeInTheDocument();
    expect(within(own).queryByText('crm.old:thing')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Show retired' }));
    const retired = await within(own).findByRole('row', { name: /crm\.old:thing/ });
    expect(within(retired).getByText('Retired')).toBeInTheDocument();
    await waitFor(() =>
      expect(calls.some((call) => new URL(call.url).search === '?include_retired=true')).toBe(true),
    );
  });

  it('explains when the product declares no permissions', async () => {
    mockApi((_request, url) =>
      url.pathname === '/v1/products/prd_1/permissions' ? jsonResponse([ACTIVE[0]]) : undefined,
    );
    renderPage(<PermissionsPage />, { me: meWith(['roles:read']), route: '/p/prd_1/permissions' });
    expect(
      await screen.findByText('This product declares no permissions of its own'),
    ).toBeInTheDocument();
  });
});

describe('PermissionsPage with permissions:manage', () => {
  const API_DECLARED = {
    name: 'crm.reports:export',
    scope: 'product',
    description: 'Export reports',
    source: 'product',
    read_like: false,
    default_roles: [],
    declared_by: 'api',
    retired_at: null,
  };

  function api() {
    return mockApi((request, url) => {
      if (url.pathname === '/v1/products/prd_1/permissions')
        return jsonResponse([...ACTIVE, API_DECLARED]);
      const match = /^\/v1\/products\/prd_1\/permissions\/(.+)$/.exec(url.pathname);
      if (match && request.method === 'PUT')
        return request.json().then((body: Record<string, unknown>) =>
          jsonResponse({
            ...body,
            name: decodeURIComponent(match[1] ?? ''),
            source: 'product',
            declared_by: 'api',
          }),
        );
      if (match && request.method === 'DELETE') return new Response(null, { status: 204 });
      return undefined;
    });
  }

  it('declares a permission over the API after checking the name', async () => {
    const calls = api();
    renderPage(<PermissionsPage />, {
      me: meWith(['roles:read', 'permissions:manage']),
      route: '/p/prd_1/permissions',
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Declare permission' }));
    const dialog = await screen.findByRole('dialog', { name: 'Declare permission' });
    const name = within(dialog).getByRole('textbox', { name: /^Permission/ });
    await user.type(name, 'Deals approve');
    await user.click(within(dialog).getByRole('button', { name: 'Declare permission' }));
    expect(within(dialog).getByText(/Use <namespace>\.<resource>:<action>/)).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);

    await user.clear(name);
    await user.type(name, 'crm.deals:close');
    await user.click(within(dialog).getByRole('checkbox', { name: 'member' }));
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: /Only reads data/ }),
      'no',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Declare permission' }));
    expect(await screen.findByText('Permission crm.deals:close declared')).toBeInTheDocument();
    const put = calls.find((call) => call.method === 'PUT');
    expect(decodeURIComponent(new URL(put?.url ?? 'http://x').pathname)).toBe(
      '/v1/products/prd_1/permissions/crm.deals:close',
    );
    expect(await put?.json()).toEqual({
      scope: 'tenant',
      description: '',
      default_roles: ['member'],
      read_like: false,
    });
  });

  it('offers changes only for API-declared permissions and retires after typing the name', async () => {
    const calls = api();
    renderPage(<PermissionsPage />, {
      me: meWith(['roles:read', 'permissions:manage']),
      route: '/p/prd_1/permissions',
    });
    const user = userEvent.setup();
    const own = await screen.findByRole('table', { name: 'Product permissions' });
    await within(own).findByText('crm.reports:export');
    expect(within(own).queryByRole('button', { name: 'Retire crm.deals:approve' })).toBeNull();
    await user.click(within(own).getByRole('button', { name: 'Retire crm.reports:export' }));
    const dialog = await screen.findByRole('dialog', { name: 'Retire permission?' });
    const confirm = within(dialog).getByRole('button', { name: 'Retire permission' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole('textbox'), 'crm.reports:export');
    await user.click(confirm);
    expect(await screen.findByText('Permission crm.reports:export retired')).toBeInTheDocument();
    await waitFor(() => expect(calls.some((call) => call.method === 'DELETE')).toBe(true));
  });

  it('shows no actions without permissions:manage', async () => {
    api();
    renderPage(<PermissionsPage />, { me: meWith(['roles:read']), route: '/p/prd_1/permissions' });
    await screen.findByText('crm.reports:export');
    expect(screen.queryByRole('button', { name: 'Declare permission' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Retire / })).not.toBeInTheDocument();
  });
});
