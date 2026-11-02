import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  jsonResponse,
  makeMe,
  mockApi,
  planFixture,
  PRODUCT_ID,
  renderProductPage,
  resetApi,
  settingsFixture,
  subscriptionFixture,
  TENANT_ID,
  tenantPage,
} from './test-helpers';
import { SubscriptionsPage } from './SubscriptionsPage';

const base = `/v1/products/${PRODUCT_ID}`;

function api(me = makeMe()) {
  return mockApi((_request, url) => {
    if (url.pathname === `${base}/billing/subscriptions`)
      return jsonResponse({
        items: [{ ...subscriptionFixture, cancel_at_period_end: true }],
        next_cursor: null,
      });
    if (url.pathname === `${base}/billing/plans`) return jsonResponse([planFixture]);
    if (url.pathname === `${base}/tenants`) return jsonResponse(tenantPage);
    if (url.pathname === '/v1/settings') return jsonResponse(settingsFixture('fake'));
    return undefined;
  }, me);
}

const render = (route = `/p/${PRODUCT_ID}/subscriptions`) =>
  renderProductPage(<SubscriptionsPage />, { route, path: '/p/:productId/subscriptions' });

afterEach(resetApi);

describe('SubscriptionsPage', { timeout: 20_000 }, () => {
  it('lists subscriptions with tenant names, status, price and trial', async () => {
    api();
    render();
    const link = await screen.findByRole('link', { name: 'Acme' });
    expect(link).toHaveAttribute('href', `/p/${PRODUCT_ID}/subscriptions/${TENANT_ID}`);
    expect(screen.getAllByText('Trial').length).toBeGreaterThan(0);
    expect(screen.getByText('Ends at period end')).toBeInTheDocument();
    expect(screen.getByText('€19.00 / month')).toBeInTheDocument();
    expect(await screen.findByText('Test double (fake)')).toBeInTheDocument();
  });

  it('filters by status and plan through the API', async () => {
    const calls = api();
    const user = userEvent.setup();
    render();
    await screen.findByRole('link', { name: 'Acme' });
    await user.selectOptions(screen.getByLabelText('Status'), 'past_due');
    await user.selectOptions(screen.getByLabelText('Plan'), 'pro');
    await waitFor(() => {
      const last = calls.filter((call) => call.path === `${base}/billing/subscriptions`).at(-1);
      expect(last?.url.searchParams.get('status')).toBe('past_due');
      expect(last?.url.searchParams.get('plan')).toBe('pro');
    });
  });

  it('opens the billing page of a chosen tenant', async () => {
    api();
    const user = userEvent.setup();
    render();
    await screen.findByRole('option', { name: 'Acme' });
    await user.selectOptions(screen.getByLabelText('Tenant'), TENANT_ID);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByText('other page')).toBeInTheDocument();
  });

  it('explains missing billing:read', async () => {
    const calls = api(makeMe(['tenants:read']));
    render();
    expect(await screen.findByText('No access to billing')).toBeInTheDocument();
    expect(calls.some((call) => call.path.includes('/billing/'))).toBe(false);
  });
});
