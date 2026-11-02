import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { testMeta } from '@/test/utils';
import {
  jsonResponse,
  makeMe,
  meterFixture,
  mockApi,
  planFixture,
  PRODUCT_ID,
  renderProductPage,
  resetApi,
  subscriptionFixture,
  TENANT_ID,
} from './test-helpers';
import { UsageBillingWidgets } from './DashboardWidgets';

const base = `/v1/products/${PRODUCT_ID}`;

function api(me = makeMe()) {
  return mockApi((_request, url) => {
    if (url.pathname === `${base}/usage/meters`) return jsonResponse([meterFixture]);
    if (url.pathname === `${base}/usage/summary`)
      return jsonResponse({
        items: [
          { tenant_id: TENANT_ID, meter: 'api_calls', value: 30, event_count: 3 },
          { tenant_id: 'ten_2', meter: 'api_calls', value: 12, event_count: 2 },
        ],
        next_cursor: null,
      });
    if (url.pathname === `${base}/billing/plans`) return jsonResponse([planFixture]);
    if (url.pathname === `${base}/billing/subscriptions`)
      return jsonResponse({
        items: [
          subscriptionFixture,
          { ...subscriptionFixture, id: 'sub_2', status: 'active' },
          { ...subscriptionFixture, id: 'sub_3', status: 'active' },
        ],
        next_cursor: 'more',
      });
    return undefined;
  }, me);
}

const render = (meta?: typeof testMeta) =>
  renderProductPage(<UsageBillingWidgets productId={PRODUCT_ID} />, {
    route: `/p/${PRODUCT_ID}/dashboard`,
    path: '/p/:productId/dashboard',
    ...(meta ? { meta } : {}),
  });

afterEach(resetApi);

describe('UsageBillingWidgets', { timeout: 20_000 }, () => {
  it('summarizes this month’s usage and subscriptions from the API', async () => {
    api();
    render();
    expect(await screen.findByText('42 calls')).toBeInTheDocument();
    expect(screen.getByText('Tenants: 2 · events: 5')).toBeInTheDocument();
    expect(screen.getByText('1 active meter of 1')).toBeInTheDocument();
    expect(await screen.findByText('1 active plan of 1')).toBeInTheDocument();
    const active = screen.getByText('Active').closest('li');
    expect(active).toHaveTextContent('2');
    expect(screen.getByText('Counted from the newest 200 subscriptions.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open usage' })).toHaveAttribute(
      'href',
      `/p/${PRODUCT_ID}/usage`,
    );
  });

  it('renders nothing when the modules are off', async () => {
    const calls = api();
    render(testMeta);
    await waitFor(() => expect(calls.some((call) => call.path === '/v1/me')).toBe(true));
    expect(screen.queryByText('Usage this month')).not.toBeInTheDocument();
    expect(screen.queryByText('Billing')).not.toBeInTheDocument();
    expect(calls.some((call) => /\/(usage|billing)\//.test(call.path))).toBe(false);
  });
});
