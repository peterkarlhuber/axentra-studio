import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import { jsonResponse } from '@/test/utils';
import {
  meWith,
  mockApi,
  renderPage,
  TENANT_ID,
  type Handler,
} from '@/features/storage/storage-test-utils';
import { RecordsPage } from './RecordsPage';

const BASE = `/v1/products/prd_1/tenants/${TENANT_ID}/records`;
const route = `/p/prd_1/records?tenant=${TENANT_ID}&collection=orders`;

const record = {
  id: 'rec_1',
  product_id: 'prd_1',
  tenant_id: TENANT_ID,
  collection: 'orders',
  data: { status: 'open', total: 12 },
  version: 2,
  created_by: 'usr_1',
  updated_by: 'usr_1',
  created_at: '2026-10-30T10:00:00Z',
  updated_at: '2026-10-30T10:00:00Z',
};

afterEach(() => {
  configureApi({ baseUrl: '' });
  setCsrfToken(null);
});

function api(write?: Handler) {
  return mockApi(async (request, url) => {
    const answer = await write?.(request, url);
    if (answer) return answer;
    if (url.pathname === '/v1/products/prd_1/collections') {
      return jsonResponse([
        { collection: 'orders', records: 1, tenants: 1, last_updated_at: record.updated_at },
      ]);
    }
    if (url.pathname === `${BASE}/orders` && request.method === 'GET') {
      return jsonResponse({ items: [record], next_cursor: null });
    }
    return undefined;
  });
}

async function openRecord() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'View record rec_1' }));
  return { user, drawer: await screen.findByRole('dialog', { name: 'Record' }) };
}

describe('RecordsPage', () => {
  it('stays read-only without records:write', async () => {
    api();
    renderPage(<RecordsPage />, { me: meWith(['collections:read'], ['records:read']), route });
    const { drawer } = await openRecord();
    expect(within(drawer).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New record' })).not.toBeInTheDocument();
  });

  it('creates a record in a new collection and switches to it', async () => {
    const calls = api(async (request, url) =>
      request.method === 'POST' && url.pathname === `${BASE}/notes`
        ? jsonResponse(
            { ...record, id: 'rec_2', collection: 'notes', data: await request.json() },
            { status: 201 },
          )
        : undefined,
    );
    renderPage(<RecordsPage />, {
      me: meWith(['collections:read'], ['records:read', 'records:write']),
      route,
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'New record' }));
    const dialog = await screen.findByRole('dialog', { name: 'New record' });
    const collection = within(dialog).getByLabelText(/Collection/);
    await user.clear(collection);
    await user.type(collection, 'Bad-Name');
    expect(within(dialog).getByText(/Use lowercase letters/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Create record' })).toBeDisabled();
    await user.clear(collection);
    await user.type(collection, 'notes');
    const data = within(dialog).getByLabelText(/Data/);
    await user.clear(data);
    await user.type(data, '{{"text":"hello"}');
    await user.click(within(dialog).getByRole('button', { name: 'Create record' }));
    expect(await screen.findByText('Record rec_2 created')).toBeInTheDocument();
    const post = calls.find((call) => call.method === 'POST');
    expect(await post?.json()).toEqual({ text: 'hello' });
    await waitFor(() =>
      expect(
        calls.some((call) => call.url.includes(`${BASE}/notes`) && call.method === 'GET'),
      ).toBe(true),
    );
  });

  it('replaces record data with If-Match and reports a concurrent change', async () => {
    let attempts = 0;
    const calls = api(async (request) => {
      if (request.method !== 'PUT') return undefined;
      attempts += 1;
      if (attempts === 1) {
        return jsonResponse(
          { code: 'precondition_failed', status: 412, request_id: 'req-412' },
          { status: 412 },
        );
      }
      return jsonResponse({ ...record, data: await request.json(), version: 3 });
    });
    renderPage(<RecordsPage />, {
      me: meWith(['collections:read'], ['records:read', 'records:write']),
      route,
    });
    const { user, drawer } = await openRecord();
    await user.click(within(drawer).getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit record' });
    const data = within(dialog).getByLabelText(/Data/);
    await user.clear(data);
    await user.type(data, '{{"status":"done"}');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Changed in the meantime')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Edit record' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Record rec_1 saved')).toBeInTheDocument();
    const put = calls.filter((call) => call.method === 'PUT').pop();
    expect(new URL(put?.url ?? 'http://x').pathname).toBe(`${BASE}/orders/rec_1`);
    expect(put?.headers.get('If-Match')).toBe('2');
    expect(await put?.json()).toEqual({ status: 'done' });
  });

  it('deletes a record after confirmation with If-Match', async () => {
    const calls = api((request) =>
      request.method === 'DELETE' ? new Response(null, { status: 204 }) : undefined,
    );
    renderPage(<RecordsPage />, {
      me: meWith(['collections:read'], ['records:read', 'records:write']),
      route,
    });
    const { user, drawer } = await openRecord();
    await user.click(within(drawer).getByRole('button', { name: 'Delete record' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete record?' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete record' }));
    expect(await screen.findByText('Record rec_1 deleted')).toBeInTheDocument();
    const del = calls.find((call) => call.method === 'DELETE');
    expect(new URL(del?.url ?? 'http://x').pathname).toBe(`${BASE}/orders/rec_1`);
    expect(del?.headers.get('If-Match')).toBe('2');
  });
});
