import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse, renderWithProviders } from '@/test/utils';
import { TenantPicker } from './TenantPicker';

const tenant = (id: string, name: string) => ({
  id,
  product_id: 'prd_1',
  slug: id,
  name,
  status: 'active',
  version: 1,
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
});

afterEach(() => configureApi({ baseUrl: '' }));

describe('TenantPicker', () => {
  it('asks the server for the first tenants by name and sorts them in the UI language', async () => {
    const urls: URL[] = [];
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (input: Request) => {
        urls.push(new URL(input.url));
        // Server order is byte-wise lower(name); the UI sorts again for its language.
        return jsonResponse({
          items: [tenant('ten_1', 'Zeta'), tenant('ten_2', 'alpha'), tenant('ten_3', 'Mu')],
          next_cursor: 'more',
        });
      },
    });
    renderWithProviders(<TenantPicker productId="prd_1" value="" onChange={() => {}} />);
    const select = await screen.findByRole('combobox', { name: /Tenant/ });
    await within(select).findByRole('option', { name: 'Zeta' });
    const names = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(names).toEqual(['Choose a tenant', 'alpha', 'Mu', 'Zeta']);
    expect(screen.getByText('Only the first 200 tenants are listed.')).toBeInTheDocument();
    expect(Object.fromEntries(urls[0]?.searchParams ?? [])).toEqual({ limit: '200', sort: 'name' });
  });
});
