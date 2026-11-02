import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import {
  jsonResponse,
  makeMe,
  meterFixture,
  mockApi,
  planFixture,
  PRODUCT_ID,
  renderProductPage,
  resetApi,
  settingsFixture,
} from './test-helpers';
import { PlansPage } from './PlansPage';

const base = `/v1/products/${PRODUCT_ID}`;

function api(extra?: (request: Request, url: URL) => Response | undefined, me = makeMe()) {
  return mockApi((request, url) => {
    const fromExtra = extra?.(request, url);
    if (fromExtra) return fromExtra;
    if (url.pathname === `${base}/billing/plans` && request.method === 'GET')
      return jsonResponse([
        planFixture,
        {
          ...planFixture,
          id: 'pln_free',
          key: 'free',
          name: 'Free',
          prices: [],
          free: true,
          entitlements: {},
          active: false,
        },
      ]);
    if (url.pathname === `${base}/usage/meters`) return jsonResponse([meterFixture]);
    if (url.pathname === '/v1/settings') return jsonResponse(settingsFixture('manual'));
    return undefined;
  }, me);
}

const render = () =>
  renderProductPage(<PlansPage />, {
    route: `/p/${PRODUCT_ID}/plans`,
    path: '/p/:productId/plans',
  });

afterEach(resetApi);

describe('PlansPage', { timeout: 20_000 }, () => {
  it('lists plans with Intl-formatted prices, entitlements and the provider state', async () => {
    api();
    render();
    expect(await screen.findByText('€19.00 / month')).toBeInTheDocument();
    expect(screen.getByText('feature.sso')).toBeInTheDocument();
    expect(screen.getAllByText('14 days').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Free').length).toBeGreaterThan(0);
    expect(await screen.findByText('Manual')).toBeInTheDocument();
    expect(screen.getByText(/never asks for card or bank details/)).toBeInTheDocument();
  });

  it('formats prices in German', async () => {
    await i18n.changeLanguage('de');
    api();
    render();
    expect(await screen.findByText('19,00 € / Monat')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tarife' })).toBeInTheDocument();
  });

  it('creates a plan with a price in minor units and entitlements', async () => {
    const calls = api((request, url) =>
      request.method === 'POST' && url.pathname === `${base}/billing/plans`
        ? jsonResponse({ ...planFixture, key: 'team', name: 'Team' }, { status: 201 })
        : undefined,
    );
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'New plan' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Name/), 'Team');
    await user.type(within(dialog).getByLabelText(/^Key/), 'team');
    const trial = within(dialog).getByLabelText(/^Trial days/);
    await user.clear(trial);
    await user.type(trial, '7');
    await user.click(within(dialog).getByRole('button', { name: 'Add price' }));
    await user.type(within(dialog).getByLabelText(/^Amount/), '9,90');
    const currency = within(dialog).getByLabelText(/^Currency/);
    await user.clear(currency);
    await user.type(currency, 'eur');
    expect(within(dialog).getByText(/Stored as 990 minor units/)).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText(/^Interval/), 'year');
    await user.click(within(dialog).getByRole('button', { name: 'Add entitlement' }));
    await user.selectOptions(within(dialog).getByLabelText(/^Type/), 'limit');
    await user.type(within(dialog).getByLabelText(/^Meter key/), 'api_calls');
    await user.type(within(dialog).getByLabelText(/^Limit$/), '5000');
    await user.click(within(dialog).getByRole('button', { name: 'Create plan' }));
    await waitFor(() =>
      expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
        key: 'team',
        name: 'Team',
        description: '',
        active: true,
        trial_days: 7,
        prices: [{ amount_minor: 990, currency: 'EUR', interval: 'year', provider_price_id: null }],
        entitlements: { 'limit.api_calls': 5000 },
      }),
    );
  });

  it('edits a plan with If-Match and keeps existing price ids', async () => {
    const calls = api((request) =>
      request.method === 'PATCH' ? jsonResponse({ ...planFixture, name: 'Pro+' }) : undefined,
    );
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Actions for plan Pro' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/^Key/)).toHaveAttribute('readonly');
    const name = within(dialog).getByLabelText(/^Name/);
    await user.clear(name);
    await user.type(name, 'Pro+');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      const patch = calls.find((call) => call.method === 'PATCH');
      expect(patch?.headers.get('If-Match')).toBe('2');
      expect(patch?.body).toMatchObject({
        name: 'Pro+',
        prices: [{ id: 'prc_1', amount_minor: 1900, currency: 'EUR', interval: 'month' }],
        entitlements: { 'feature.sso': true, 'limit.api_calls': 1000 },
      });
    });
  });

  it('shows the conflict when deleting a plan in use', async () => {
    api((request) =>
      request.method === 'DELETE'
        ? jsonResponse(
            { code: 'conflict', status: 409, detail: 'plan is in use', request_id: 'req-9' },
            { status: 409 },
          )
        : undefined,
    );
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Actions for plan Pro' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete plan' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'pro');
    await user.click(within(dialog).getByRole('button', { name: 'Delete plan' }));
    expect(await screen.findByText(/req-9/)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('is read-only without billing:manage and hides the provider without settings access', async () => {
    api(undefined, makeMe(['billing:read']));
    render();
    expect(await screen.findByText('€19.00 / month')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for plan/ })).not.toBeInTheDocument();
    expect(screen.getByText(/configuration is not visible to you/)).toBeInTheDocument();
  });
});
