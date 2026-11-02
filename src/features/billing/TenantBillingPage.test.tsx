import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
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
  subscriptionFixture,
  TENANT_ID,
  tenantPage,
} from './test-helpers';
import { TenantBillingPage } from './TenantBillingPage';

const base = `/v1/products/${PRODUCT_ID}`;
const tb = `${base}/tenants/${TENANT_ID}/billing`;
const freePlan = {
  ...planFixture,
  id: 'pln_free',
  key: 'free',
  name: 'Free',
  prices: [],
  free: true,
  trial_days: 0,
  entitlements: {},
};
const entitlements = {
  product_id: PRODUCT_ID,
  tenant_id: TENANT_ID,
  plan_key: 'pro',
  subscription_id: 'sub_1',
  subscription_status: 'trialing',
  features: { sso: true },
  limits: { api_calls: 1000 },
  overrides: {},
};

interface Options {
  subscription?: object | null;
  provider?: string;
  live?: boolean;
  extra?: (request: Request, url: URL) => Response | undefined;
  me?: ReturnType<typeof makeMe>;
}

function api({
  subscription = subscriptionFixture,
  provider = 'manual',
  live = false,
  extra,
  me,
}: Options = {}) {
  return mockApi((request, url) => {
    const fromExtra = extra?.(request, url);
    if (fromExtra) return fromExtra;
    const path = url.pathname;
    if (path === `${base}/tenants/${TENANT_ID}`) return jsonResponse(tenantPage.items[0]);
    if (path === `${tb}/subscription` && request.method === 'GET')
      return subscription
        ? jsonResponse(subscription)
        : jsonResponse({ code: 'not_found', status: 404 }, { status: 404 });
    if (path === `${tb}/plans`) return jsonResponse([planFixture, freePlan]);
    if (path === `${tb}/entitlements`) return jsonResponse(entitlements);
    if (path === `${base}/usage/meters`) return jsonResponse([meterFixture]);
    if (path === '/v1/settings') return jsonResponse(settingsFixture(provider, live));
    return undefined;
  }, me);
}

const render = () =>
  renderProductPage(<TenantBillingPage />, {
    route: `/p/${PRODUCT_ID}/subscriptions/${TENANT_ID}`,
    path: '/p/:productId/subscriptions/:tenantId',
  });

afterEach(resetApi);

describe('TenantBillingPage', { timeout: 20_000 }, () => {
  it('shows the subscription with trial info and the effective entitlements', async () => {
    api();
    render();
    expect(await screen.findByRole('heading', { level: 1, name: 'Acme' })).toBeInTheDocument();
    expect(await screen.findByText(/Trial ends in \d+ days/)).toBeInTheDocument();
    expect(screen.getByText('€19.00 / month')).toBeInTheDocument();
    expect(await screen.findByText('sso: on')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('subscribes a tenant without a subscription to a plan', async () => {
    const calls = api({
      subscription: null,
      extra: (request, url) =>
        request.method === 'POST' && url.pathname === `${tb}/subscription`
          ? jsonResponse(subscriptionFixture, { status: 201 })
          : undefined,
    });
    const user = userEvent.setup();
    render();
    expect(await screen.findByText('No subscription')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Subscribe to a plan' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByRole('option', { name: 'Pro (pro)' });
    await user.selectOptions(within(dialog).getByLabelText(/^Plan/), 'pro');
    expect(within(dialog).getByText(/collect the payment outside Axentra/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Subscribe' }));
    await waitFor(() =>
      expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
        plan: 'pro',
        price_id: 'prc_1',
      }),
    );
  });

  it('cancels at period end after confirmation', async () => {
    const calls = api({
      extra: (_request, url) =>
        url.pathname === `${tb}/subscription/cancel`
          ? jsonResponse({ ...subscriptionFixture, cancel_at_period_end: true })
          : undefined,
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Cancel at period end' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel at period end' }));
    await waitFor(() =>
      expect(calls.find((call) => call.path.endsWith('/cancel'))?.body).toEqual({
        at_period_end: true,
      }),
    );
  });

  it('changes the plan with If-Match and sets a manual status', async () => {
    const calls = api({
      extra: (_request, url) => {
        if (url.pathname === `${tb}/subscription/change-plan`)
          return jsonResponse({ ...subscriptionFixture, plan_key: 'free', price: null });
        if (url.pathname === `${tb}/subscription/status`)
          return jsonResponse({ ...subscriptionFixture, status: 'active' });
        return undefined;
      },
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Change plan' }));
    let dialog = await screen.findByRole('dialog');
    await within(dialog).findByRole('option', { name: 'Free (free)' });
    await user.selectOptions(within(dialog).getByLabelText(/^Plan/), 'free');
    await user.click(within(dialog).getByRole('button', { name: 'Change plan' }));
    await waitFor(() => {
      const change = calls.find((call) => call.path.endsWith('/change-plan'));
      expect(change?.headers.get('If-Match')).toBe('4');
      expect(change?.body).toEqual({ plan: 'free', price_id: null });
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Set status' }));
    dialog = await screen.findByRole('dialog');
    const options = within(dialog)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(options).toEqual(['Active', 'Past due', 'Canceled']);
    await user.click(within(dialog).getByRole('button', { name: 'Set status' }));
    await waitFor(() =>
      expect(calls.find((call) => call.path.endsWith('/status'))?.body).toEqual({
        status: 'active',
      }),
    );
  });

  it('offers a hosted checkout for paid plans only when the API reports a test provider', async () => {
    const calls = api({
      subscription: null,
      provider: 'fake',
      extra: (_request, url) =>
        url.pathname === `${tb}/checkout`
          ? jsonResponse(
              {
                provider: 'fake',
                checkout_id: 'cs_fake_000001',
                url: 'https://checkout.fake.invalid/cs_fake_000001',
                completed: false,
                subscription: { ...subscriptionFixture, status: 'incomplete', provider: 'fake' },
              },
              { status: 201 },
            )
          : undefined,
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Subscribe to a plan' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByRole('option', { name: 'Pro (pro)' });
    await user.selectOptions(within(dialog).getByLabelText(/^Plan/), 'pro');
    await user.click(within(dialog).getByRole('button', { name: 'Start checkout' }));
    await waitFor(() => {
      const body = calls.find((call) => call.path.endsWith('/checkout'))?.body as Record<
        string,
        string
      >;
      expect(body.plan).toBe('pro');
      expect(body.success_url).toMatch(/^http:\/\/localhost.*\?checkout=success$/);
    });
    const link = await screen.findByRole('link', { name: /Open checkout page/ });
    expect(link).toHaveAttribute('href', 'https://checkout.fake.invalid/cs_fake_000001');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('never starts a checkout when live payments are on', async () => {
    api({ subscription: null, provider: 'stripe', live: true });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Subscribe to a plan' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByRole('option', { name: 'Pro (pro)' });
    await user.selectOptions(within(dialog).getByLabelText(/^Plan/), 'pro');
    expect(within(dialog).getByText(/does not start real-money checkouts/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Start checkout' })).toBeDisabled();
  });

  it('replaces entitlement overrides', async () => {
    const calls = api({
      extra: (_request, url) =>
        url.pathname === `${tb}/entitlements/overrides`
          ? jsonResponse({ ...entitlements, overrides: { 'feature.beta': true } })
          : undefined,
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Edit overrides' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Add entitlement' }));
    await user.type(within(dialog).getByLabelText(/^Feature name/), 'beta');
    await user.click(within(dialog).getByRole('button', { name: 'Save overrides' }));
    await waitFor(() =>
      expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
        entitlements: { 'feature.beta': true },
      }),
    );
    expect(await screen.findByText('feature.beta')).toBeInTheDocument();
  });

  it('is read-only without billing:manage', async () => {
    api({ me: makeMe(['billing:read']) });
    render();
    expect(await screen.findByText(/Trial ends in/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel now' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit overrides' })).not.toBeInTheDocument();
  });
});
