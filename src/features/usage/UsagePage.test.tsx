import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  jsonResponse,
  makeMe,
  meterFixture,
  mockApi,
  PRODUCT_ID,
  renderProductPage,
  resetApi,
  TENANT_ID,
  tenantPage,
} from '@/features/billing/test-helpers';
import { UsagePage } from './UsagePage';

const base = `/v1/products/${PRODUCT_ID}`;
const tenantBase = `${base}/tenants/${TENANT_ID}/usage`;

const points = [
  { day: '2026-10-31', value: 0, event_count: 0 },
  { day: '2026-11-01', value: 5, event_count: 1 },
];

const meterUsage = {
  meter: 'api_calls',
  name: 'API calls',
  unit: 'calls',
  aggregation: 'sum',
  reset_period: 'month',
  period_start: '2026-11-01T00:00:00Z',
  period_end: '2026-12-01T00:00:00Z',
  value: 5,
  event_count: 1,
  reserved: 0,
  limit: 100,
  remaining: 95,
  enforcement: 'hard',
  source: 'quota',
  over_limit: false,
};

function api(extra?: (request: Request, url: URL) => Response | undefined) {
  return mockApi((request, url) => {
    const fromExtra = extra?.(request, url);
    if (fromExtra) return fromExtra;
    const path = url.pathname;
    if (path === `${base}/usage/meters` && request.method === 'GET')
      return jsonResponse([meterFixture]);
    if (path === `${base}/usage/timeseries`)
      return jsonResponse({
        meter: 'api_calls',
        unit: 'calls',
        aggregation: 'sum',
        tenant_id: null,
        since: '2026-10-31',
        until: '2026-11-01',
        points,
      });
    if (path === `${base}/usage/summary`)
      return jsonResponse({
        items: [{ tenant_id: TENANT_ID, meter: 'api_calls', value: 5, event_count: 1 }],
        next_cursor: null,
      });
    if (path === `${base}/tenants`) return jsonResponse(tenantPage);
    if (path === `${tenantBase}/summary`) return jsonResponse([meterUsage]);
    if (path === `${tenantBase}/timeseries`)
      return jsonResponse({
        meter: 'api_calls',
        unit: 'calls',
        aggregation: 'sum',
        tenant_id: TENANT_ID,
        since: '2026-10-31',
        until: '2026-11-01',
        points,
      });
    if (path === `${tenantBase}/events`)
      return jsonResponse({
        items: [
          {
            id: 'uev_1',
            product_id: PRODUCT_ID,
            tenant_id: TENANT_ID,
            meter: 'api_calls',
            quantity: 5,
            idempotency_key: 'req-42',
            occurred_at: '2026-11-01T10:00:00Z',
            recorded_at: '2026-11-01T10:00:01Z',
            period_start: '2026-11-01T00:00:00Z',
            properties: { route: '/x' },
            reservation_id: null,
          },
        ],
        next_cursor: null,
      });
    return undefined;
  });
}

afterEach(resetApi);

describe('UsagePage', { timeout: 20_000 }, () => {
  it('shows the product chart with a data table and totals per tenant', async () => {
    api();
    renderProductPage(<UsagePage />, {
      route: `/p/${PRODUCT_ID}/usage`,
      path: '/p/:productId/usage',
    });
    const chart = await screen.findByRole(
      'img',
      { name: /API calls, all tenants: bar chart/ },
      { timeout: 5000 },
    );
    expect(chart.getAttribute('aria-label')).toContain('Total 5 calls');
    const table = screen.getByRole('table', { name: /API calls, all tenants per day/ });
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(await screen.findByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      `/p/${PRODUCT_ID}/usage?tab=tenant&tenant=${TENANT_ID}`,
    );
  });

  it('creates a meter with limit and enforcement', async () => {
    const calls = api((request, url) =>
      url.pathname === `${base}/usage/meters` && request.method === 'POST'
        ? jsonResponse({ ...meterFixture, key: 'reports' }, { status: 201 })
        : undefined,
    );
    const user = userEvent.setup();
    renderProductPage(<UsagePage />, {
      route: `/p/${PRODUCT_ID}/usage?tab=meters`,
      path: '/p/:productId/usage',
    });
    expect(await screen.findByText('api_calls')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New meter' }));
    const dialog = await screen.findByRole('dialog');
    const key = within(dialog).getByLabelText(/^Key/);
    await user.type(key, 'Bad key');
    expect(within(dialog).getByText(/Use lowercase letters/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Create meter' })).toBeDisabled();
    await user.clear(key);
    await user.type(key, 'reports');
    await user.type(within(dialog).getByLabelText(/^Unit/), 'reports');
    await user.selectOptions(within(dialog).getByLabelText(/^Aggregation/), 'max');
    await user.type(within(dialog).getByLabelText(/^Default limit/), '10');
    await user.selectOptions(within(dialog).getByLabelText(/^Enforcement/), 'soft');
    await user.click(within(dialog).getByRole('button', { name: 'Create meter' }));
    await waitFor(() =>
      expect(calls.find((call) => call.method === 'POST')?.body).toMatchObject({
        key: 'reports',
        unit: 'reports',
        aggregation: 'max',
        reset_period: 'month',
        default_limit: 10,
        default_enforcement: 'soft',
      }),
    );
  });

  it('deletes a meter after typing its key, with If-Match', async () => {
    const calls = api((request) =>
      request.method === 'DELETE' ? new Response(null, { status: 204 }) : undefined,
    );
    const user = userEvent.setup();
    renderProductPage(<UsagePage />, {
      route: `/p/${PRODUCT_ID}/usage?tab=meters`,
      path: '/p/:productId/usage',
    });
    await user.click(await screen.findByRole('button', { name: 'Actions for meter api_calls' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete meter' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'api_calls');
    await user.click(within(dialog).getByRole('button', { name: 'Delete meter' }));
    await waitFor(() => {
      const del = calls.find((call) => call.method === 'DELETE');
      expect(del?.path).toBe(`${base}/usage/meters/mtr_1`);
      expect(del?.headers.get('If-Match')).toBe('3');
    });
  });

  it('shows tenant usage with limits, events and quota override', async () => {
    const calls = api((request, url) =>
      request.method === 'PUT' && url.pathname === `${tenantBase}/quotas/api_calls`
        ? jsonResponse({
            meter: 'api_calls',
            limit: 500,
            enforcement: 'soft',
            source: 'quota',
            period: 'month',
          })
        : undefined,
    );
    const user = userEvent.setup();
    renderProductPage(<UsagePage />, {
      route: `/p/${PRODUCT_ID}/usage?tab=tenant&tenant=${TENANT_ID}`,
      path: '/p/:productId/usage',
    });
    expect(await screen.findByText(/5 of 100 calls used \(5 %\)/)).toBeInTheDocument();
    expect(screen.getByText('Tenant override')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /API calls: 5 %/ })).toBeInTheDocument();
    expect(await screen.findByText('req-42')).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: /API calls of this tenant/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set override' }));
    const dialog = await screen.findByRole('dialog');
    const limit = within(dialog).getByLabelText(/^Limit/);
    await user.clear(limit);
    await user.type(limit, '500');
    await user.selectOptions(within(dialog).getByLabelText(/^Enforcement/), 'soft');
    await user.click(within(dialog).getByRole('button', { name: 'Save override' }));
    await waitFor(() =>
      expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
        limit: 500,
        enforcement: 'soft',
      }),
    );
    expect(screen.getByRole('button', { name: 'Remove override' })).toBeInTheDocument();
  });

  it('looks up a reservation and releases it', async () => {
    const reservation = {
      id: 'res_1',
      product_id: PRODUCT_ID,
      tenant_id: TENANT_ID,
      meter: 'api_calls',
      quantity: 3,
      status: 'active',
      period_start: '2026-11-01T00:00:00Z',
      expires_at: '2099-01-01T00:00:00Z',
      event_id: null,
      committed_quantity: null,
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
    };
    let status = 'active';
    const calls = api((_request, url) => {
      if (url.pathname === `${tenantBase}/reservations/res_1`)
        return jsonResponse({ ...reservation, status });
      if (url.pathname === `${tenantBase}/reservations/res_1/release`) {
        status = 'released';
        return jsonResponse({ ...reservation, status });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderProductPage(<UsagePage />, {
      route: `/p/${PRODUCT_ID}/usage?tab=tenant&tenant=${TENANT_ID}`,
      path: '/p/:productId/usage',
    });
    await user.type(await screen.findByLabelText('Reservation id'), 'res_1');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByText('Active')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Release' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Release' }));
    await waitFor(() =>
      expect(calls.some((call) => call.path.endsWith('/reservations/res_1/release'))).toBe(true),
    );
    expect(await screen.findByText('Released')).toBeInTheDocument();
  });

  it('explains missing permission instead of loading data', async () => {
    const calls = mockApi(() => undefined, makeMe(['tenants:read']));
    renderProductPage(<UsagePage />, {
      route: `/p/${PRODUCT_ID}/usage`,
      path: '/p/:productId/usage',
    });
    expect(await screen.findByText('No access to usage')).toBeInTheDocument();
    expect(calls.some((call) => call.path.includes('/usage/'))).toBe(false);
  });
});
