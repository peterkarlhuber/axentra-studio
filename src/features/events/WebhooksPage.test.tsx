import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { endpoint } from './webhook-fixtures';
import { WebhooksPage } from './WebhooksPage';
import { PID, mockApi, page, renderPage } from './test-helpers';

afterEach(() => configureApi({ baseUrl: '' }));

function render() {
  return renderPage(<WebhooksPage />, {
    route: `/p/${PID}/webhooks`,
    path: '/p/:productId/webhooks',
  });
}

describe('WebhooksPage', { timeout: 20_000 }, () => {
  it('lists endpoints with their event types', async () => {
    mockApi(({ path }) => (path.endsWith('/webhooks') ? page([endpoint]) : undefined));
    render();
    expect(
      await screen.findByRole('link', { name: 'https://hooks.example.com/axentra' }),
    ).toHaveAttribute('href', `/p/${PID}/webhooks/whk_1`);
    expect(screen.getByText('invoice.*')).toBeInTheDocument();
    expect(screen.getByText('CRM sync')).toBeInTheDocument();
  });

  it('validates the URL, creates an endpoint and shows the secret once', async () => {
    const { calls } = mockApi(({ method, path }) => {
      if (method === 'GET' && path.endsWith('/webhooks')) return page([]);
      if (method === 'GET' && path.endsWith('/events')) {
        return page([{ id: 'evt_1', type: 'invoice.created' }]);
      }
      if (method === 'POST' && path === `/v1/products/${PID}/webhooks`) {
        return jsonResponse({ endpoint, secret: 'whsec_supersecret' }, { status: 201 });
      }
      return undefined;
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'New endpoint' }));
    const dialog = await screen.findByRole('dialog', { name: 'New endpoint' });
    const url = within(dialog).getByLabelText(/^URL/);
    await user.type(url, 'ftp://hooks.example.com');
    expect(within(dialog).getByText(/Only https:\/\//)).toBeInTheDocument();
    await user.clear(url);
    await user.type(url, 'https://user:pw@hooks.example.com');
    expect(within(dialog).getByText(/must not contain a user name/)).toBeInTheDocument();
    await user.clear(url);
    await user.type(url, 'https://hooks.example.com/axentra');

    expect(within(dialog).getByRole('button', { name: 'Create endpoint' })).toBeDisabled();
    await user.click(await within(dialog).findByRole('button', { name: 'Add invoice.created' }));
    await user.type(
      within(dialog).getByRole('combobox', { name: /^Event types/ }),
      'user.*{Enter}',
    );
    const chips = within(dialog).getByRole('list', { name: 'Selected event types' });
    expect(within(chips).getByText('invoice.created')).toBeInTheDocument();
    expect(within(chips).getByText('user.*')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Create endpoint' }));

    const secretDialog = await screen.findByRole('dialog', { name: 'Signing secret' });
    expect(within(secretDialog).getByText(/shown only this once/)).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      url: 'https://hooks.example.com/axentra',
      description: '',
      event_types: ['invoice.created', 'user.*'],
      enabled: true,
    });
    const done = within(secretDialog).getByRole('button', { name: 'Done' });
    expect(done).toBeDisabled();
    await user.click(within(secretDialog).getByRole('checkbox'));
    await user.click(done);
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(`/p/${PID}/webhooks/whk_1`),
    );
  });

  it('offers no create action without webhooks:manage', async () => {
    mockApi(({ path }) => (path.endsWith('/webhooks') ? page([endpoint]) : undefined), {
      permissions: ['webhooks:read'],
    });
    render();
    expect(await screen.findByText('CRM sync')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New endpoint' })).not.toBeInTheDocument();
  });
});
