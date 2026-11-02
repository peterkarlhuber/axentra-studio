import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setCsrfToken } from '@/api/csrf';
import {
  PRODUCT_ID,
  jsonResponse,
  makeMe,
  mockApi,
  renderProductPage,
  resetApi,
} from '@/features/billing/test-helpers';
import { ApiKeysPage } from './ApiKeysPage';
import { expiryFor, localDateValue, minCustomDate } from './api-key-expiry';

const DAY = 24 * 60 * 60 * 1000;
const PERMISSIONS = [
  { name: 'records:read', scope: 'tenant', description: 'Read records', source: 'builtin' },
];

function keyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'key_1',
    product_id: PRODUCT_ID,
    tenant_id: null,
    name: 'nightly-export',
    prefix: 'axk_01abc_',
    permissions: ['records:read'],
    status: 'active',
    created_by: 'usr_1',
    created_at: '2026-10-01T00:00:00Z',
    last_used_at: null,
    expires_at: null,
    replaces: null,
    ...overrides,
  };
}

function api(keys: unknown[] = []) {
  return mockApi(
    (request, url) => {
      if (url.pathname === `/v1/products/${PRODUCT_ID}/api-keys` && request.method === 'GET') {
        return jsonResponse(keys);
      }
      if (url.pathname === `/v1/products/${PRODUCT_ID}/api-keys` && request.method === 'POST') {
        return jsonResponse({ key: keyRow(), secret: 'axk_01abc_secret' }, { status: 201 });
      }
      if (url.pathname === `/v1/products/${PRODUCT_ID}/permissions`) {
        return jsonResponse(PERMISSIONS);
      }
      return undefined;
    },
    makeMe(['api_keys:read', 'api_keys:manage', 'records:read']),
  );
}

function renderCreate() {
  renderProductPage(<ApiKeysPage />, {
    route: `/p/${PRODUCT_ID}/api-keys?new=1`,
    path: '/p/:productId/api-keys',
  });
}

async function fillBasics() {
  const user = userEvent.setup();
  const dialog = await screen.findByRole('dialog', { name: 'New API key' });
  await user.type(within(dialog).getByRole('textbox', { name: /^Name/ }), 'nightly-export');
  await user.click(await within(dialog).findByRole('checkbox', { name: /records:read/ }));
  return { user, dialog };
}

const posts = (calls: ReturnType<typeof api>) =>
  calls.filter((call) => call.method === 'POST' && call.path.endsWith('/api-keys'));

afterEach(() => {
  resetApi();
  setCsrfToken(null);
});

describe('expiryFor', () => {
  const now = new Date(2026, 10, 2, 15, 30); // 2 Nov 2026, 15:30 local

  it('sends nothing for "never" and counts presets from now', () => {
    expect(expiryFor('never', '', now)).toEqual({ ok: true, expiresAt: null });
    expect(expiryFor('30', '', now)).toEqual({
      ok: true,
      expiresAt: new Date(now.getTime() + 30 * DAY).toISOString(),
    });
  });

  it('accepts a custom day after today and expires at its end (local time)', () => {
    expect(minCustomDate(now)).toBe('2026-11-03');
    expect(expiryFor('custom', '2026-11-03', now)).toEqual({
      ok: true,
      expiresAt: new Date(2026, 10, 3, 23, 59, 59).toISOString(),
    });
  });

  it('refuses today, past days and a missing date', () => {
    expect(expiryFor('custom', localDateValue(now), now)).toEqual({ ok: false, reason: 'past' });
    expect(expiryFor('custom', '2025-01-01', now)).toEqual({ ok: false, reason: 'past' });
    expect(expiryFor('custom', '', now)).toEqual({ ok: false, reason: 'missing' });
  });
});

describe('ApiKeysPage create dialog: expiry', () => {
  it('creates a key without expiry by default', async () => {
    const calls = api();
    renderCreate();
    const { user, dialog } = await fillBasics();
    expect(within(dialog).getByRole('combobox', { name: /Expiry/ })).toHaveValue('never');
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }));
    await waitFor(() => expect(posts(calls)).toHaveLength(1));
    expect(posts(calls)[0]?.body).toEqual({
      name: 'nightly-export',
      permissions: ['records:read'],
    });
  });

  it('sends expires_at for a preset', async () => {
    const calls = api();
    renderCreate();
    const { user, dialog } = await fillBasics();
    await user.selectOptions(within(dialog).getByRole('combobox', { name: /Expiry/ }), '90');
    const before = Date.now();
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }));
    await waitFor(() => expect(posts(calls)).toHaveLength(1));
    const sent = Date.parse((posts(calls)[0]?.body as { expires_at: string }).expires_at);
    expect(sent).toBeGreaterThanOrEqual(before + 90 * DAY);
    expect(sent).toBeLessThanOrEqual(Date.now() + 90 * DAY);
    expect(await screen.findByRole('dialog', { name: /Secret for/ })).toBeInTheDocument();
  });

  it('validates a custom date before sending and then sends the end of that day', async () => {
    const calls = api();
    renderCreate();
    const { user, dialog } = await fillBasics();
    await user.selectOptions(within(dialog).getByRole('combobox', { name: /Expiry/ }), 'custom');
    const date = within(dialog).getByLabelText(/Expiry date/, { selector: 'input' });
    expect(date).toHaveAttribute('min', minCustomDate());
    await user.type(date, localDateValue(new Date()));
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }));
    expect(await within(dialog).findByText('Choose a date after today.')).toBeInTheDocument();
    expect(posts(calls)).toHaveLength(0);

    await user.clear(date);
    await user.type(date, '2099-12-31');
    await user.click(within(dialog).getByRole('button', { name: 'Create key' }));
    await waitFor(() => expect(posts(calls)).toHaveLength(1));
    expect((posts(calls)[0]?.body as { expires_at: string }).expires_at).toBe(
      new Date(2099, 11, 31, 23, 59, 59).toISOString(),
    );
  });

  it('lists the expiry of existing keys', async () => {
    const expiresAt = new Date(Date.now() + 30 * DAY).toISOString();
    api([keyRow({ expires_at: expiresAt })]);
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    const row = await screen.findByRole('row', { name: /nightly-export/ });
    expect(row.querySelector(`time[datetime="${expiresAt}"]`)).not.toBeNull();
  });
});
