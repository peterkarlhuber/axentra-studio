import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { NotificationsPage } from './NotificationsPage';
import {
  PRODUCT,
  TENANT,
  builtinTemplate,
  mailboxEntry,
  makeMe,
  makeMessage,
  mockApi,
  renderInProduct,
  stats,
  template,
} from './notify-test-utils';

const MANAGER = ['notify:manage', 'notify:send', 'tenants:read'];
const base = `/v1/products/${PRODUCT}/notify`;

afterEach(() => configureApi({ baseUrl: '' }));

function standardHandler(overrides: Record<string, () => Response> = {}) {
  return (request: Request, url: URL) => {
    const key = `${request.method} ${url.pathname}`;
    if (overrides[key]) return overrides[key]();
    if (key === `GET ${base}/stats`) return jsonResponse(stats);
    if (key === `GET ${base}/templates`) return jsonResponse([builtinTemplate, template]);
    if (key === `GET ${base}/messages`) return jsonResponse({ items: [makeMessage()] });
    if (key === `GET ${base}/mailbox`) return jsonResponse({ items: [mailboxEntry] });
    if (key === `GET /v1/products/${PRODUCT}/tenants`)
      return jsonResponse({ items: [{ id: TENANT, name: 'Acme' }] });
    return undefined;
  };
}

describe('NotificationsPage', () => {
  it('lists templates incl. built-ins and shows delivery statistics', async () => {
    const me = makeMe(MANAGER);
    mockApi(me, standardHandler());
    renderInProduct(<NotificationsPage />, me);

    expect(await screen.findByRole('link', { name: 'Welcome' })).toHaveAttribute(
      'href',
      `/p/${PRODUCT}/notifications/templates/welcome`,
    );
    expect(screen.getByRole('link', { name: 'Tenant invitation' })).toBeInTheDocument();
    expect(screen.getByText('Built-in')).toBeInTheDocument();
    expect(screen.getByText('v3')).toBeInTheDocument();
    // Built-ins cannot be deleted; own templates can.
    expect(screen.getByRole('button', { name: 'Delete template Welcome' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete template Tenant invitation' }),
    ).not.toBeInTheDocument();
    // `invitation` is system-only: no "Send test", a badge and an explanation instead.
    expect(screen.getByText('System only')).toBeInTheDocument();
    expect(screen.getByText(/cannot be sent as a test/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send test.*Welcome/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Send test.*Tenant invitation/ }),
    ).not.toBeInTheDocument();
    const statsTable = await screen.findByRole('table', { name: 'Messages by status' });
    expect(within(statsTable).getByRole('row', { name: /Sent 7 3/ })).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('deletes a template with If-Match after typed confirmation', async () => {
    const me = makeMe(MANAGER);
    const calls = mockApi(
      me,
      standardHandler({
        [`DELETE ${base}/templates/welcome`]: () => new Response(null, { status: 204 }),
      }),
    );
    renderInProduct(<NotificationsPage />, me);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Delete template Welcome' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Type welcome/), 'welcome');
    await user.click(within(dialog).getByRole('button', { name: 'Delete template' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'DELETE')).toBe(true));
    const del = calls.find((call) => call.method === 'DELETE');
    expect(del?.headers.get('If-Match')).toBe('3');
  });

  it('shows the message log with attempts and redacted error, and retries a failed message', async () => {
    const me = makeMe(MANAGER);
    const calls = mockApi(
      me,
      standardHandler({
        [`POST ${base}/messages/msg_1/retry`]: () =>
          jsonResponse(makeMessage({ status: 'queued', attempts: 0, last_error: null })),
      }),
    );
    renderInProduct(<NotificationsPage />, me, `/p/${PRODUCT}/notifications?tab=messages`);
    const row = (await screen.findByText('ada@example.com')).closest('tr') as HTMLElement;
    expect(within(row).getByText('Failed')).toBeInTheDocument();
    expect(within(row).getByText('5 of 5')).toBeInTheDocument();
    expect(within(row).getByText('smtp 550 [redacted]')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(within(row).getByRole('button', { name: 'Retry delivery of message msg_1' }));
    await waitFor(() =>
      expect(calls.some((call) => call.url.endsWith('/messages/msg_1/retry'))).toBe(true),
    );
    expect(await screen.findByText(/Message queued again/)).toBeInTheDocument();
  });

  it('filters messages by status', async () => {
    const me = makeMe(MANAGER);
    const calls = mockApi(me, standardHandler());
    renderInProduct(<NotificationsPage />, me, `/p/${PRODUCT}/notifications?tab=messages`);
    const user = userEvent.setup();
    await screen.findByText('ada@example.com');
    await user.selectOptions(screen.getByLabelText('Status'), 'failed');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(calls.some((call) => new URL(call.url).searchParams.get('status') === 'failed')).toBe(
        true,
      ),
    );
  });

  it('opens a message and renders its HTML in a sandboxed frame without scripts', async () => {
    const me = makeMe(MANAGER);
    mockApi(
      me,
      standardHandler({
        [`GET ${base}/messages/msg_1`]: () =>
          jsonResponse(
            makeMessage({
              content: { subject: 'Welcome Ada', text: 'Hi Ada', html: '<p>Hi Ada</p>' },
            }),
          ),
      }),
    );
    renderInProduct(<NotificationsPage />, me, `/p/${PRODUCT}/notifications?tab=messages`);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Show details of message msg_1' }));
    const dialog = await screen.findByRole('dialog');
    const frame = await within(dialog).findByTitle('Content');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame.getAttribute('srcdoc')).toContain('<p>Hi Ada</p>');
    expect(frame.getAttribute('srcdoc')).toContain("default-src 'none'");
    expect(within(dialog).getByText('Welcome Ada')).toBeInTheDocument();
  });

  it('shows the local mailbox', async () => {
    const me = makeMe(MANAGER);
    mockApi(me, standardHandler());
    renderInProduct(<NotificationsPage />, me, `/p/${PRODUCT}/notifications?tab=mailbox`);
    expect(await screen.findByText('Welcome Ada')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Open message Welcome Ada' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Axentra <no-reply@localhost>')).toBeInTheDocument();
  });

  it('explains that there is no mailbox with a real provider', async () => {
    const me = makeMe(MANAGER);
    const calls = mockApi(
      me,
      standardHandler({
        [`GET ${base}/stats`]: () => jsonResponse({ ...stats, provider: 'smtp' }),
      }),
    );
    renderInProduct(<NotificationsPage />, me, `/p/${PRODUCT}/notifications?tab=mailbox`);
    expect(await screen.findByText('No local mailbox on this server')).toBeInTheDocument();
    expect(screen.getByText(/delivers with “smtp”/)).toBeInTheDocument();
    expect(calls.some((call) => call.url.includes('/mailbox'))).toBe(false);
  });

  it('handles a mode_not_supported answer from the mailbox endpoint', async () => {
    const me = makeMe(MANAGER);
    mockApi(
      me,
      standardHandler({
        [`GET ${base}/stats`]: () =>
          jsonResponse({ code: 'internal', status: 500 }, { status: 500 }),
        [`GET ${base}/mailbox`]: () =>
          jsonResponse({ code: 'mode_not_supported', status: 409 }, { status: 409 }),
      }),
    );
    renderInProduct(<NotificationsPage />, me, `/p/${PRODUCT}/notifications?tab=mailbox`);
    expect(await screen.findByText('No local mailbox on this server')).toBeInTheDocument();
  });

  it('offers only the preferences to users without notify:manage', async () => {
    const me = makeMe([]);
    mockApi(me, (_request, url) => {
      if (url.pathname === `${base}/preferences/me`)
        return jsonResponse({
          product_id: PRODUCT,
          tenant_id: null,
          user_id: 'usr_me',
          opted_out: [],
          available_categories: ['onboarding'],
          locked_categories: ['transactional', 'security'],
          version: 0,
        });
      if (url.pathname === `/v1/products/${PRODUCT}/tenants`) return jsonResponse({ items: [] });
      return undefined;
    });
    renderInProduct(<NotificationsPage />, me);
    expect(await screen.findByRole('checkbox', { name: 'onboarding' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Templates' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'New template' })).not.toBeInTheDocument();
  });
});
