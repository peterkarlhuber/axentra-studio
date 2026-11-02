import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import { testMeta, jsonResponse } from '@/test/utils';
import { DataOverviewPage } from './DataOverviewPage';
import { meWith, mockApi, renderPage, TENANT_ID, usage } from './storage-test-utils';

const route = '/p/prd_1/data';

afterEach(() => {
  configureApi({ baseUrl: '' });
  setCsrfToken(null);
});

function api() {
  return mockApi((_request, url) => {
    if (url.pathname === '/v1/products/prd_1/collections') {
      return jsonResponse([
        {
          collection: 'orders',
          records: 1200,
          tenants: 3,
          last_updated_at: '2026-10-31T08:00:00Z',
        },
        { collection: 'notes', records: 5, tenants: 1, last_updated_at: null },
      ]);
    }
    if (url.pathname === '/v1/products/prd_1/storage/usage') {
      return jsonResponse({
        product_id: 'prd_1',
        bytes_used: 3 * 1024 ** 2,
        files_used: 7,
        default_quota_bytes: null,
        default_quota_files: 100,
        tenants: [
          { ...usage, bytes_used: 3 * 1024 ** 2, files_used: 7, quota_bytes_override: 1024 ** 3 },
        ],
        next_cursor: null,
      });
    }
    if (url.pathname === '/v1/settings') {
      return jsonResponse({
        storage: {
          backend: 'local',
          max_file_bytes: 50 * 1024 ** 2,
          allowed_content_types: [],
          store_blocked_as_inert: false,
        },
        observability: { audit_retention_days: 365, job_retention_days: 14 },
      });
    }
    return undefined;
  });
}

describe('DataOverviewPage', () => {
  it('shows collection stats, storage usage per tenant and configuration from the API', async () => {
    api();
    renderPage(<DataOverviewPage />, { me: meWith(['collections:read', 'product:manage']), route });

    const collections = await screen.findByRole('table', { name: 'Record collections' });
    expect(await within(collections).findByRole('link', { name: 'orders' })).toHaveAttribute(
      'href',
      '/p/prd_1/records?collection=orders',
    );
    expect(within(collections).getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('1,205')).toBeInTheDocument();

    const storage = await screen.findByRole('table', { name: 'Storage usage per tenant' });
    const tenantLink = await within(storage).findByRole('link', { name: 'Tenant One' });
    expect(tenantLink).toHaveAttribute('href', `/p/prd_1/files?tenant=${TENANT_ID}`);
    // Column header plus the badge marking the tenant's own quota override.
    expect(within(storage).getAllByText('Tenant')).toHaveLength(2);
    expect(screen.getAllByText('3 MiB').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Unlimited').length).toBeGreaterThan(0);

    expect(await screen.findByText('50 MiB')).toBeInTheDocument();
    expect(screen.getByText('local')).toBeInTheDocument();
    expect(screen.getByText('365 days')).toBeInTheDocument();
    expect(screen.getByText('14 days')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Backups are not reported' })).toBeInTheDocument();
  });

  it('explains missing collections:read and does not call the statistics endpoints', async () => {
    const calls = api();
    renderPage(<DataOverviewPage />, { me: meWith([], ['records:read']), route });
    expect(
      await screen.findByRole('heading', { name: 'Product statistics not available' }),
    ).toBeInTheDocument();
    expect(calls.some((call) => call.url.includes('/collections'))).toBe(false);
    expect(calls.some((call) => call.url.includes('/storage/usage'))).toBe(false);
    expect(calls.some((call) => call.url.includes('/settings'))).toBe(false);
  });

  it('says when the storage module is not enabled', async () => {
    api();
    renderPage(<DataOverviewPage />, {
      me: meWith(['collections:read']),
      route,
      modules: testMeta.modules,
    });
    expect(
      await screen.findByRole('heading', { name: 'Storage module not enabled' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'orders' })).toBeInTheDocument();
  });
});
