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
