import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import { jsonResponse } from '@/test/utils';
import { StoragePolicyCard } from './StoragePolicyCard';
import { parseList } from './storage-utils';
import { meWith, mockApi, renderPage } from './storage-test-utils';

afterEach(() => {
  configureApi({ baseUrl: '' });
  setCsrfToken(null);
});

const POLICY = {
  product_id: 'prd_1',
  blocked_types: 'refuse',
  blocked_types_source: 'installation',
  installation_blocked_types: 'refuse',
  blocked_extensions: [],
  blocked_content_types: [],
  inert_extensions: [],
  builtin_blocked_extensions: ['html', 'js', 'sh'],
  builtin_blocked_content_types: ['text/html'],
  allowed_content_types: [],
  product_version: 4,
};

describe('parseList', () => {
  it('splits, lowercases, strips dots from extensions and removes duplicates', () => {
    expect(parseList(' .PY, rb;py  sh', { extensions: true })).toEqual(['py', 'rb', 'sh']);
    expect(parseList('text/X-Python,')).toEqual(['text/x-python']);
    expect(parseList('')).toEqual([]);
  });
});

describe('StoragePolicyCard', () => {
  it('saves the policy with If-Match and shows the built-in blocklist', async () => {
    const bodies: unknown[] = [];
    const headers: (string | null)[] = [];
    mockApi(async (request, url) => {
      if (url.pathname !== '/v1/products/prd_1/storage/policy') return undefined;
      if (request.method === 'PUT') {
        const body = (await request.json()) as Record<string, unknown>;
        bodies.push(body);
        headers.push(request.headers.get('If-Match'));
        return jsonResponse({
          ...POLICY,
          ...body,
          blocked_types_source: 'product',
          product_version: 5,
        });
      }
      return jsonResponse(POLICY);
    });
    renderPage(<StoragePolicyCard productId="prd_1" canEdit />, {
      me: meWith(['product:manage']),
      route: '/p/prd_1/x',
    });
    const mode = await screen.findByRole('combobox', { name: 'Blocked file types' });
    expect(mode).toHaveValue('inherit');
    expect(
      screen.getByRole('option', { name: 'Installation default (Refuse the upload)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('.html')).toBeInTheDocument();
    await userEvent.selectOptions(mode, 'store_inert');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Extensions accepted as inert attachments' }),
      '.HTML, sh',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Additionally blocked extensions' }),
      'py',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      blocked_types: 'store_inert',
      blocked_extensions: ['py'],
      blocked_content_types: [],
      inert_extensions: ['html', 'sh'],
    });
    expect(headers[0]).toBe('4');
    expect(await screen.findByText('Content-type policy saved')).toBeTruthy();
  });

  it('is read-only without product:manage', async () => {
    mockApi((_request, url) =>
      url.pathname === '/v1/products/prd_1/storage/policy'
        ? jsonResponse({ ...POLICY, blocked_types: 'store_inert', blocked_types_source: 'product' })
        : undefined,
    );
    renderPage(<StoragePolicyCard productId="prd_1" canEdit={false} />, {
      me: meWith(['product:read']),
      route: '/p/prd_1/x',
    });
    const mode = await screen.findByRole('combobox', { name: 'Blocked file types' });
    expect(mode).toHaveValue('store_inert');
    expect(mode).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
});
