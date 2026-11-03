import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  PRODUCT_ID,
  jsonResponse,
  makeMe,
  mockApi,
  renderProductPage,
  resetApi,
} from '@/features/billing/test-helpers';
import { DashboardPage } from './DashboardPage';

const product = {
  id: PRODUCT_ID,
  slug: 'acme',
  name: 'Acme',
  status: 'active',
  settings: {},
  version: 1,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
};

afterEach(resetApi);

function render(overview: Record<string, unknown>, permissions?: string[]) {
  mockApi(
    (_request, url) =>
      url.pathname === `/v1/products/${PRODUCT_ID}/overview`
        ? jsonResponse({ product, ...overview })
        : undefined,
    permissions ? makeMe(permissions) : undefined,
  );
  renderProductPage(<DashboardPage />, {
    route: `/p/${PRODUCT_ID}/dashboard`,
    path: '/p/:productId/dashboard',
  });
}

/** The counters list of the overview section, once the counters have loaded. */
async function overviewList() {
  const region = await screen.findByRole('region', { name: 'Overview' });
  await within(region).findByText('Tenants');
  return within(region).getByRole('list');
}

const counters = (list: HTMLElement) =>
  within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');

describe('DashboardPage overview', () => {
  it('shows product-wide counters without a scope note', async () => {
    render({
      scope: 'product',
      tenants: 3,
      users: 5,
      api_keys: 2,
      records: 40,
      audit_events_24h: 7,
      denied_events_24h: 0,
    });
    const list = await overviewList();
    expect(within(list).getByText('API keys')).toBeInTheDocument();
    expect(counters(list)).toHaveLength(6);
    expect(screen.queryByTestId('overview-scope')).not.toBeInTheDocument();
  });

  it('hides counters the server leaves null for tenant callers and says what is counted', async () => {
    render(
      {
        scope: 'tenant',
        tenants: 1,
        users: 4,
        api_keys: null,
        records: 12,
        audit_events_24h: null,
        denied_events_24h: null,
      },
      ['records:read', 'members:read', 'tenant:read'],
    );
    expect(
      await screen.findByText(/These figures cover only the tenants you belong to/),
    ).toBeInTheDocument();
    const list = await overviewList();
    const shown = counters(list).join(' ');
    expect(shown).toContain('Tenants');
    expect(shown).toContain('Records');
    // Product-wide counters are absent, not shown as 0.
    expect(within(list).queryByText('API keys')).not.toBeInTheDocument();
    expect(within(list).queryByText(/Audit events/)).not.toBeInTheDocument();
    expect(within(list).queryByText(/Denied requests/)).not.toBeInTheDocument();
    expect(counters(list)).toHaveLength(3);
  });
});
