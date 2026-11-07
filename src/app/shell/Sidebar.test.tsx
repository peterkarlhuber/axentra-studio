import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Me, ProductAccess } from '@/api/models';
import { makeMe, mockApi, resetApi } from '@/features/billing/test-helpers';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';
import { canReadAudit } from '../navigation';
import { Sidebar } from './Sidebar';

/** A user without platform role, operator of one product with the given permissions. */
function operator(permissions: string[]): Me {
  const me = makeMe([]);
  return {
    ...me,
    platform_role: null,
    user: { ...me.user, platform_role: null },
    products: [
      {
        product: { id: 'prd_1', slug: 'crm', name: 'CRM' },
        role: 'support',
        permissions,
        tenants: [],
      } as unknown as ProductAccess,
    ],
  } as unknown as Me;
}

function tenantMember(permissions: string[]): Me {
  const me = operator([]);
  return {
    ...me,
    products: [
      {
        product: { id: 'prd_1', slug: 'crm', name: 'CRM' },
        role: null,
        permissions: [],
        tenants: [{ tenant: { id: 'ten_1', name: 'Acme' }, role: 'tenant_owner', permissions }],
      } as unknown as ProductAccess,
    ],
  } as unknown as Me;
}

const nav = () => screen.getByRole('navigation', { name: 'Main navigation' });

afterEach(resetApi);

describe('canReadAudit', () => {
  it('needs platform:audit or audit:read in a product, never a tenant role', () => {
    expect(canReadAudit(makeMe(['platform:audit']))).toBe(true);
    expect(canReadAudit(operator(['audit:read']))).toBe(true);
    expect(canReadAudit(operator(['product:read']))).toBe(false);
    expect(canReadAudit(tenantMember(['audit:read', 'tenant:read']))).toBe(false);
  });
});

describe('Sidebar permission filter', () => {
  it('hides the audit log without an audit permission, keeps settings and monitoring', async () => {
    mockApi(() => undefined, operator(['product:read', 'tenants:read']));
    renderWithProviders(<Sidebar productId="prd_1" collapsed={false} />);
    // The item is shown until `/v1/me` (two requests: session, me) is known; on a busy machine
    // that takes longer than waitFor's default second.
    await waitFor(
      () => expect(screen.queryByRole('link', { name: 'Audit log' })).not.toBeInTheDocument(),
      { timeout: 5_000 },
    );
    // Settings holds the personal preferences; Monitoring and System health show public checks.
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Monitoring' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'System health' })).toBeInTheDocument();
    expect(nav()).toHaveTextContent('Audit & Monitoring');
  });

  it('shows the audit log with audit:read in a product', async () => {
    mockApi(() => undefined, operator(['product:read', 'audit:read']));
    renderWithProviders(<Sidebar productId="prd_1" collapsed={false} />);
    expect(await screen.findByRole('link', { name: 'Audit log' })).toHaveAttribute(
      'href',
      '/audit',
    );
  });

  it('keeps items of disabled modules visible and marked "Off"', async () => {
    mockApi(() => undefined, makeMe(['platform:audit']));
    // `testMeta` does not enable the webhooks module.
    expect(testMeta.modules).not.toContain('webhooks');
    renderWithProviders(<Sidebar productId="prd_1" collapsed={false} />);
    const webhooks = await screen.findByRole('link', { name: /Webhooks/ });
    expect(webhooks).toHaveTextContent('Off');
    expect(screen.getByRole('link', { name: 'Audit log' })).toBeInTheDocument();
  });

  it('shows the unread count of the inbox next to its entry', async () => {
    const calls = mockApi(
      (_request, url) =>
        url.pathname === '/v1/products/prd_1/notify/inbox/me/unread'
          ? jsonResponse({ unread: 3 })
          : undefined,
      operator(['product:read']),
    );
    const meta = { ...testMeta, modules: [...testMeta.modules, 'notify'] };
    renderWithProviders(<Sidebar productId="prd_1" collapsed={false} />, { meta });
    const inbox = await screen.findByRole('link', { name: /Inbox/ });
    expect(inbox).toHaveAttribute('href', '/p/prd_1/inbox');
    await waitFor(() => expect(inbox).toHaveTextContent('3'), { timeout: 5_000 });
    expect(inbox).toHaveAccessibleName('Inbox 3 unread');
    expect(calls.filter((call) => call.path.endsWith('/inbox/me/unread'))).toHaveLength(1);
  });

  it('does not ask for the unread count without the notify module', async () => {
    const calls = mockApi(() => undefined, operator(['product:read']));
    renderWithProviders(<Sidebar productId="prd_1" collapsed={false} />);
    const inbox = await screen.findByRole('link', { name: /Inbox/ });
    expect(inbox).toHaveTextContent('Off');
    await waitFor(() => expect(calls.some((call) => call.path === '/v1/me')).toBe(true));
    expect(calls.some((call) => call.path.includes('/inbox/'))).toBe(false);
  });
});
