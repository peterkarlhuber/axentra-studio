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

describe('ApiKeysPage header', () => {
  it('says that a key depends on its creator and links to the explanation', async () => {
    api();
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    expect(
      await screen.findByText(
        /A key works only as long as the person who created it still holds the permissions it uses\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: 'Learn more' })
        .some((link) => link.getAttribute('href')?.includes('creator-permissions')),
    ).toBe(true);
  });
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

  it('marks an active key whose creator lost permissions and names them', async () => {
    api([
      keyRow({
        creator_has_access: false,
        withheld_permissions: ['records:read'],
        grace_until: null,
      }),
      keyRow({ id: 'key_ok', name: 'healthy', creator_has_access: true, withheld_permissions: [] }),
    ]);
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    const row = await screen.findByRole('row', { name: /nightly-export/ });
    expect(within(row).getByText('Creator lost access')).toBeInTheDocument();
    expect(within(row).getByText('Not usable for: records:read')).toBeInTheDocument();
    const healthy = screen.getByRole('row', { name: /healthy/ });
    expect(within(healthy).queryByText('Creator lost access')).not.toBeInTheDocument();
  });

  it('shows the end of a rotation grace period from grace_until', async () => {
    const graceUntil = new Date(Date.now() + DAY).toISOString();
    api([keyRow({ grace_until: graceUntil, revoked_at: graceUntil })]);
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    const row = await screen.findByRole('row', { name: /nightly-export/ });
    expect(within(row).getByText(/Replaced, stops working/)).toBeInTheDocument();
    expect(row.querySelector(`time[datetime="${graceUntil}"]`)).not.toBeNull();
  });
});

describe('ApiKeysPage rotate and revoke', () => {
  function keysApi() {
    let rotated = false;
    let revoked = false;
    const calls = mockApi(
      (request, url) => {
        const base = `/v1/products/${PRODUCT_ID}/api-keys`;
        if (url.pathname === base && request.method === 'GET') {
          if (rotated)
            return jsonResponse([
              keyRow({ id: 'key_2', replaces: 'key_1' }),
              keyRow({ expires_at: '2099-01-01T00:00:00Z' }),
            ]);
          return jsonResponse([keyRow({ status: revoked ? 'revoked' : 'active' })]);
        }
        if (url.pathname === `${base}/key_1/rotate`) {
          rotated = true;
          return jsonResponse(
            { key: keyRow({ id: 'key_2', replaces: 'key_1' }), secret: 'axk_new_secret' },
            { status: 201 },
          );
        }
        if (url.pathname === `${base}/key_1/revoke`) {
          revoked = true;
          return jsonResponse({ revoked: 1 });
        }
        return undefined;
      },
      makeMe(['api_keys:read', 'api_keys:manage', 'records:read']),
    );
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    return calls;
  }

  async function openAction(user: ReturnType<typeof userEvent.setup>, name: string) {
    await user.click(await screen.findByRole('button', { name: 'Actions for nightly-export' }));
    await user.click(await screen.findByRole('menuitem', { name }));
  }

  it('rotates with the chosen grace period and shows the new secret once', async () => {
    const calls = keysApi();
    const user = userEvent.setup();
    await openAction(user, 'Rotate secret');
    const dialog = await screen.findByRole('dialog', { name: 'Rotate secret?' });
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: /Grace period/ }),
      '86400',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Rotate secret' }));
    const secret = await screen.findByRole('dialog', { name: 'Secret for “nightly-export”' });
    const rotate = calls.find((call) => call.path.endsWith('/key_1/rotate'));
    expect(rotate?.body).toEqual({ grace_seconds: 86400 });
    expect(rotate?.headers.get('X-Axentra-CSRF')).toBe('csrf-1');
    // The secret dialog cannot be closed before confirming the secret was stored.
    const done = within(secret).getByRole('button', { name: 'Done' });
    expect(done).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(secret).toBeInTheDocument();
    await user.click(within(secret).getByRole('checkbox', { name: /I have stored the secret/ }));
    await user.click(done);
    await waitFor(() => expect(secret).not.toBeInTheDocument());
  });

  it('revokes only after typing the key name and then offers no more actions', async () => {
    const calls = keysApi();
    const user = userEvent.setup();
    await openAction(user, 'Revoke key');
    const dialog = await screen.findByRole('dialog', { name: 'Revoke API key?' });
    const confirm = within(dialog).getByRole('button', { name: 'Revoke key' });
    expect(confirm).toBeDisabled();
    await user.type(
      within(dialog).getByRole('textbox', { name: /Type nightly-export/ }),
      'nightly-export',
    );
    await user.click(confirm);
    expect(await screen.findByText('API key “nightly-export” revoked')).toBeInTheDocument();
    expect(calls.some((call) => call.path.endsWith('/key_1/revoke'))).toBe(true);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Actions for nightly-export' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('lists the keys that stop working with the revoked one', async () => {
    mockApi(
      (request, url) => {
        if (url.pathname.endsWith('/api-keys') && request.method === 'GET')
          return jsonResponse([
            keyRow(),
            keyRow({ id: 'key_2', name: 'child', prefix: 'axk_02', created_by: 'key_1' }),
            keyRow({ id: 'key_3', name: 'grandchild', prefix: 'axk_03', created_by: 'key_2' }),
            keyRow({
              id: 'key_4',
              name: 'gone',
              prefix: 'axk_04',
              created_by: 'key_1',
              status: 'revoked',
            }),
            keyRow({ id: 'key_5', name: 'unrelated', prefix: 'axk_05' }),
          ]);
        return undefined;
      },
      makeMe(['api_keys:read', 'api_keys:manage', 'records:read']),
    );
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    const user = userEvent.setup();
    await openAction(user, 'Revoke key');
    const dialog = await screen.findByRole('dialog', { name: 'Revoke API key?' });
    const list = within(dialog).getByRole('list', {
      name: 'Also stops working: 2 keys created with it or with those',
    });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['child axk_02…', 'grandchild axk_03…']);
  });

  it('keeps the confirmation open and explains a refused revocation', async () => {
    mockApi(
      (request, url) => {
        if (url.pathname.endsWith('/api-keys') && request.method === 'GET')
          return jsonResponse([keyRow()]);
        if (url.pathname.endsWith('/revoke'))
          return jsonResponse(
            {
              code: 'forbidden',
              status: 403,
              detail: 'missing api_keys:manage',
              request_id: 'r-1',
            },
            { status: 403 },
          );
        return undefined;
      },
      makeMe(['api_keys:read', 'api_keys:manage']),
    );
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    const user = userEvent.setup();
    await openAction(user, 'Revoke key');
    const dialog = await screen.findByRole('dialog', { name: 'Revoke API key?' });
    await user.type(
      within(dialog).getByRole('textbox', { name: /Type nightly-export/ }),
      'nightly-export',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Revoke key' }));
    expect(await screen.findByText(/missing api_keys:manage/)).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
  });

  it('offers no create, rotate or revoke without api_keys:manage', async () => {
    mockApi(
      (_request, url) =>
        url.pathname.endsWith('/api-keys') ? jsonResponse([keyRow()]) : undefined,
      makeMe(['api_keys:read']),
    );
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    expect(await screen.findByText('nightly-export')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New API key' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for nightly-export' }),
    ).not.toBeInTheDocument();
  });
});

describe('ApiKeysPage grace period', () => {
  it('says when a rotated key stops working', async () => {
    const inOneHour = new Date(Date.now() + 3_600_000).toISOString();
    mockApi(
      (_request, url) =>
        url.pathname.endsWith('/api-keys')
          ? jsonResponse([
              keyRow({ revoked_at: inOneHour }),
              keyRow({ id: 'key_2', name: 'other' }),
            ])
          : undefined,
      makeMe(['api_keys:read']),
    );
    renderProductPage(<ApiKeysPage />, {
      route: `/p/${PRODUCT_ID}/api-keys`,
      path: '/p/:productId/api-keys',
    });
    const row = (await screen.findByText('nightly-export')).closest('tr') as HTMLElement;
    expect(within(row).getByText(/Replaced, stops working/)).toBeInTheDocument();
    expect(within(row).getByText(/in 1 hour|in 60 minutes/)).toBeInTheDocument();
    const other = screen.getByText('other').closest('tr') as HTMLElement;
    expect(within(other).queryByText(/Replaced/)).not.toBeInTheDocument();
  });
});
