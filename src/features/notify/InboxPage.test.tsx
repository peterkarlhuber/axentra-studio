import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import type { InboxEntry } from '@/api/models';
import { jsonResponse } from '@/test/utils';
import { InboxPage } from './InboxPage';
import { PRODUCT, TENANT, makeMe, mockApi, renderInProduct } from './notify-test-utils';

afterEach(() => configureApi({ baseUrl: '' }));

const INBOX = `/v1/products/${PRODUCT}/notify/inbox/me`;

function entry(id: string, patch: Partial<InboxEntry> = {}): InboxEntry {
  return {
    id,
    product_id: PRODUCT,
    tenant_id: TENANT,
    template_key: 'invoice_ready',
    category: 'billing',
    created_at: '2026-11-06T10:00:00Z',
    read_at: null,
    subject: `Invoice ${id} is ready`,
    text: `Your invoice ${id} is ready.\nOpen the billing page to pay it.`,
    content_state: 'available',
    ...patch,
  };
}

/**
 * A fake inbox: GET lists (with `unread_only` and `tenant_id`), `unread` counts and `read`
 * marks the given ids or all unread ones.
 */
function inboxApi(initial: InboxEntry[]) {
  const rows = initial.map((row) => ({ ...row }));
  const me = makeMe([]);
  const calls = mockApi(me, async (request, url) => {
    const tenant = url.searchParams.get('tenant_id');
    const scoped = rows.filter((row) => !tenant || row.tenant_id === tenant);
    if (url.pathname === INBOX) {
      const unreadOnly = url.searchParams.get('unread_only') === 'true';
      return jsonResponse({
        items: scoped.filter((row) => !unreadOnly || !row.read_at),
        next_cursor: null,
      });
    }
    if (url.pathname === `${INBOX}/unread`) {
      return jsonResponse({ unread: scoped.filter((row) => !row.read_at).length });
    }
    if (url.pathname === `${INBOX}/read` && request.method === 'POST') {
      const body = (await request.json()) as { message_ids?: string[] };
      let marked = 0;
      for (const row of scoped) {
        if (row.read_at || (body.message_ids && !body.message_ids.includes(row.id))) continue;
        row.read_at = '2026-11-07T00:00:00Z';
        marked += 1;
      }
      return jsonResponse({ marked });
    }
    if (url.pathname === `/v1/products/${PRODUCT}/tenants`) {
      return jsonResponse({ items: [{ id: TENANT, name: 'Acme', slug: 'acme' }] });
    }
    return undefined;
  });
  return { calls, me, rows };
}

const renderInbox = (me: ReturnType<typeof makeMe>) =>
  renderInProduct(<InboxPage />, me, `/p/${PRODUCT}/inbox`, '/p/:productId/inbox');

const readCalls = (calls: Request[]) =>
  calls.filter((call) => call.method === 'POST' && new URL(call.url).pathname === `${INBOX}/read`);

describe('InboxPage', () => {
  it('lists the notifications with the unread ones marked and counted', async () => {
    const { me } = inboxApi([entry('n1'), entry('n2', { read_at: '2026-11-06T11:00:00Z' })]);
    renderInbox(me);
    expect(await screen.findByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Inbox' });
    const unreadRow = (await within(table).findByText('Invoice n1 is ready')).closest('tr')!;
    // Unread is said in words, not only by the dot.
    expect(within(unreadRow).getByText('Unread:')).toBeInTheDocument();
    const readRow = within(table).getByText('Invoice n2 is ready').closest('tr')!;
    expect(within(readRow).queryByText('Unread:')).not.toBeInTheDocument();
    expect(await screen.findByText('1 unread')).toBeInTheDocument();
    expect(
      within(unreadRow).getByRole('button', { name: 'Mark “Invoice n1 is ready” as read' }),
    ).toBeInTheDocument();
    expect(within(readRow).queryByRole('button', { name: /as read/ })).not.toBeInTheDocument();
  });

  it('opens a notification, shows its text and marks it as read', async () => {
    const { calls, me } = inboxApi([entry('n1')]);
    const user = userEvent.setup();
    renderInbox(me);
    await user.click(await screen.findByRole('button', { name: 'Open “Invoice n1 is ready”' }));
    const drawer = await screen.findByRole('dialog', { name: 'Invoice n1 is ready' });
    expect(within(drawer).getByText(/Open the billing page to pay it\./)).toBeInTheDocument();
    expect(within(drawer).getByText('invoice_ready')).toBeInTheDocument();
    await waitFor(() => expect(readCalls(calls)).toHaveLength(1));
    expect(await readCalls(calls)[0]!.json()).toEqual({ message_ids: ['n1'] });
    expect(await screen.findByText('0 unread')).toBeInTheDocument();
  });

  it('marks all unread notifications of the scope as read', async () => {
    const { calls, me } = inboxApi([entry('n1'), entry('n2')]);
    const user = userEvent.setup();
    renderInbox(me);
    const markAll = await screen.findByRole('button', { name: 'Mark all as read' });
    await waitFor(() => expect(markAll).toBeEnabled());
    await user.click(markAll);
    expect(await screen.findByText('2 notifications marked as read')).toBeInTheDocument();
    expect(await readCalls(calls)[0]!.json()).toEqual({});
    await waitFor(() => expect(markAll).toBeDisabled());
    expect(screen.queryByText('Unread:')).not.toBeInTheDocument();
  });

  it('filters by tenant and to unread notifications', async () => {
    const { calls, me } = inboxApi([
      entry('n1', { read_at: '2026-11-06T11:00:00Z' }),
      entry('n2', { tenant_id: null }),
    ]);
    const user = userEvent.setup();
    renderInbox(me);
    await screen.findByText('Invoice n1 is ready');

    await user.click(screen.getByRole('switch', { name: 'Only unread' }));
    await waitFor(() => expect(screen.queryByText('Invoice n1 is ready')).not.toBeInTheDocument());
    expect(screen.getByText('Invoice n2 is ready')).toBeInTheDocument();

    await user.selectOptions(await screen.findByRole('combobox', { name: /Tenant/ }), TENANT);
    expect(await screen.findByText('No unread notifications')).toBeInTheDocument();
    const lists = calls.map((call) => new URL(call.url)).filter((url) => url.pathname === INBOX);
    expect(lists.at(-1)?.searchParams.get('tenant_id')).toBe(TENANT);
    expect(lists.at(-1)?.searchParams.get('unread_only')).toBe('true');
    // Without the switch the parameter is left out instead of sent as "false".
    expect(lists[0]?.searchParams.has('unread_only')).toBe(false);
  });

  it('explains an empty inbox and content that is no longer available', async () => {
    const empty = inboxApi([]);
    const { unmount } = renderInbox(empty.me);
    expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    unmount();

    const purged = inboxApi([
      entry('n3', { subject: null, text: null, content_state: 'purged', read_at: 'x' }),
    ]);
    const user = userEvent.setup();
    renderInbox(purged.me);
    await user.click(await screen.findByRole('button', { name: 'Open “(no subject)”' }));
    const drawer = await screen.findByRole('dialog', { name: '(no subject)' });
    expect(
      within(drawer).getByText('The content was erased by the retention policy.'),
    ).toBeInTheDocument();
  });
});
