import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { delivery, endpoint } from './webhook-fixtures';
import { WebhookDetailPage } from './WebhookDetailPage';
import { PID, mockApi, page, renderPage } from './test-helpers';

afterEach(() => configureApi({ baseUrl: '' }));

const base = `/v1/products/${PID}/webhooks/whk_1`;

function render(route = `/p/${PID}/webhooks/whk_1`) {
  return renderPage(<WebhookDetailPage />, { route, path: '/p/:productId/webhooks/:webhookId' });
}

function api(extra: Parameters<typeof mockApi>[0] = () => undefined) {
  return mockApi(async (call) => {
    const answer = await extra(call);
    if (answer) return answer;
    if (call.method === 'GET' && call.path === base) return jsonResponse(endpoint);
    if (call.method === 'GET' && call.path === `${base}/deliveries`) return page([delivery]);
    if (call.method === 'GET' && call.path === `${base}/deliveries/dlv_1`) {
      return jsonResponse(delivery);
    }
    if (call.method === 'GET' && call.path.endsWith('/events')) return page([]);
    return undefined;
  });
}

describe('WebhookDetailPage', { timeout: 20_000 }, () => {
  it('shows deliveries with status and response code and redelivers one', async () => {
    const { calls } = api(({ method, path }) =>
      method === 'POST' && path === `${base}/deliveries/dlv_1/redeliver`
        ? jsonResponse({ ...delivery, status: 'pending' }, { status: 202 })
        : undefined,
    );
    const user = userEvent.setup();
    render();
    expect(await screen.findByRole('rowheader', { name: /invoice.created/ })).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getAllByText('Dead').length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText('Status'), 'dead');
    await waitFor(() =>
      expect(calls.some((call) => call.search.get('status') === 'dead')).toBe(true),
    );

    await user.click(screen.getByRole('button', { name: 'Show delivery dlv_1' }));
    const drawer = await screen.findByRole('dialog', { name: 'invoice.created' });
    expect(within(drawer).getByRole('region', { name: /Response body/ })).toHaveTextContent(
      'Internal Server Error',
    );
    await user.click(within(drawer).getByRole('button', { name: 'Redeliver' }));
    expect(await screen.findByText('Delivery queued again')).toBeInTheDocument();
    expect(calls.some((call) => call.path.endsWith('/redeliver'))).toBe(true);
  });

  it('sends a test ping and reports a failing endpoint honestly', async () => {
    api(({ method, path }) =>
      method === 'POST' && path === `${base}/test`
        ? jsonResponse({
            ...delivery,
            id: 'dlv_ping',
            event_id: null,
            event_type: 'axentra.ping',
            status: 'dead',
            response_code: 503,
          })
        : undefined,
    );
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Send test ping' }));
    expect(await screen.findByText('Test ping failed')).toBeInTheDocument();
    expect(screen.getByText('The endpoint answered with HTTP 503.')).toBeInTheDocument();
    expect(await screen.findByRole('dialog', { name: 'axentra.ping' })).toBeInTheDocument();
  });

  it('rotates the secret with a grace period and shows the new secret once', async () => {
    const { calls } = api(({ method, path }) =>
      method === 'POST' && path === `${base}/rotate-secret`
        ? jsonResponse({
            endpoint: { ...endpoint, version: 3, has_previous_secret: true },
            secret: 'whsec_new',
          })
        : undefined,
    );
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Rotate secret' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rotate signing secret' });
    await user.selectOptions(within(dialog).getByLabelText('Grace period'), '86400');
    await user.click(within(dialog).getByRole('button', { name: 'Rotate secret' }));
    expect(await screen.findByRole('dialog', { name: 'Signing secret' })).toBeInTheDocument();
    expect(calls.find((call) => call.path.endsWith('/rotate-secret'))?.body).toEqual({
      grace_seconds: 86400,
    });
    expect(await screen.findByText('Previous secret still valid')).toBeInTheDocument();
  });

  it('saves changed settings with If-Match and deletes the endpoint', async () => {
    const { calls } = api(({ method }) => {
      if (method === 'PATCH') return jsonResponse({ ...endpoint, enabled: false, version: 3 });
      if (method === 'DELETE') return new Response(null, { status: 204 });
      return undefined;
    });
    const user = userEvent.setup();
    render(`/p/${PID}/webhooks/whk_1?tab=settings`);
    const form = await screen.findByRole('form', { name: 'Settings' });
    const save = within(form).getByRole('button', { name: 'Save changes' });
    expect(save).toBeDisabled();
    await user.click(within(form).getByRole('switch', { name: 'Enabled' }));
    await user.click(save);
    await waitFor(() => expect(calls.some((call) => call.method === 'PATCH')).toBe(true));
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.body).toEqual({ enabled: false });
    expect(patch?.headers.get('If-Match')).toBe('2');
    expect(await screen.findByText('Endpoint saved')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete endpoint' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete webhook endpoint' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete endpoint' }));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(`/p/${PID}/webhooks`),
    );
    expect(calls.find((call) => call.method === 'DELETE')?.headers.get('If-Match')).toBe('3');
  });
});
