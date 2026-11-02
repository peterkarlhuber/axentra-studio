import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import type { Me } from '@/api/models';
import { jsonResponse, renderWithProviders } from '@/test/utils';
import { AuditPage } from './AuditPage';

const me = {
  user: { id: 'usr_admin', email: 'admin@example.com', name: 'Admin' },
  actor_kind: 'user',
  platform_role: 'platform_admin',
  platform_permissions: ['platform:audit', 'audit:read'],
  products: [],
} as unknown as Me;

const event = {
  id: 'aud_1',
  action: 'tenancy.member.set',
  actor_display: 'admin@example.com',
  actor_id: 'usr_admin',
  actor_kind: 'user',
  details: { role: 'viewer' },
  ip: null,
  occurred_at: '2026-11-01T10:00:00Z',
  outcome: 'success',
  product_id: null,
  request_id: null,
  target_id: 'usr_x',
  target_type: 'user',
  tenant_id: null,
};

afterEach(() => configureApi({ baseUrl: '' }));

describe('AuditPage', () => {
  it('keeps the list values when the event lookup answers 404', async () => {
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        const url = new URL(request.url);
        if (url.pathname === '/v1/auth/session') return jsonResponse({ csrf_token: 'csrf' });
        if (url.pathname === '/v1/me') return jsonResponse(me);
        if (url.pathname === '/v1/audit')
          return jsonResponse({ items: [event], next_cursor: null });
        if (url.pathname === '/v1/products') return jsonResponse([]);
        return jsonResponse({ code: 'not_found', status: 404 }, { status: 404 });
      },
    });
    renderWithProviders(<AuditPage />, { route: '/audit' });
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: /tenancy\.member\.set/ }, { timeout: 5000 }),
    );
    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByText(/could not be loaded/)).toBeInTheDocument();
    expect(within(drawer).getByText('aud_1')).toBeInTheDocument();
  });
});
