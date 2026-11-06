import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setCsrfToken } from '@/api/csrf';
import { queryKeys } from '@/api/queryKeys';
import { Route, Routes } from 'react-router';
import { jsonResponse, makeMe, mockApi, resetApi } from '@/features/billing/test-helpers';
import { createTestQueryClient, renderWithProviders, testMeta } from '@/test/utils';
import { ProductsPage } from './ProductsPage';

const product = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `prd_${n}`,
  name: `Product ${n}`,
  slug: `product-${n}`,
  description: '',
  status: 'active',
  settings: {},
  version: 1,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  ...extra,
});

afterEach(() => {
  resetApi();
  setCsrfToken(null);
});

function render(
  permissions: string[],
  mode: 'multi' | 'single' = 'multi',
  products = [product(1)],
) {
  const calls = mockApi((request, url) => {
    if (url.pathname === '/v1/products' && request.method === 'GET') return jsonResponse(products);
    if (url.pathname === '/v1/products' && request.method === 'POST')
      return jsonResponse(product(2, { name: 'Acme Cloud', slug: 'acme-cloud' }), { status: 201 });
    return undefined;
  }, makeMe(permissions));
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(queryKeys.session, { csrf_token: 'csrf-1' });
  setCsrfToken('csrf-1');
  renderWithProviders(
    <Routes>
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<p>product detail</p>} />
    </Routes>,
    { route: '/products', queryClient, meta: { ...testMeta, mode } },
  );
  return calls;
}

describe('ProductsPage', () => {
  it('creates a product with a slug derived from the name and opens it', async () => {
    const calls = render(['products:create', 'products:read']);
    const user = userEvent.setup();
    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New product' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create product' });
    const submit = within(dialog).getByRole('button', { name: 'Create product' });
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByRole('textbox', { name: /^Name/ }), 'Acme Cloud');
    expect(within(dialog).getByRole('textbox', { name: /^Slug/ })).toHaveValue('acme-cloud');
    await user.click(submit);
    expect(await screen.findByText('product detail')).toBeInTheDocument();
    expect(screen.getByText('Product “Acme Cloud” created')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      name: 'Acme Cloud',
      slug: 'acme-cloud',
      description: '',
    });
  });

  it('opens the create dialog from the address and closes it back to the plain list', async () => {
    mockApi(
      (request, url) => {
        if (url.pathname === '/v1/products' && request.method === 'GET') return jsonResponse([]);
        return undefined;
      },
      makeMe(['products:create', 'products:read']),
    );
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
      </Routes>,
      { route: '/products?new=1' },
    );
    const user = userEvent.setup();
    const dialog = await screen.findByRole('dialog', { name: 'Create product' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Create product' })).not.toBeInTheDocument(),
    );
  });

  it('ignores ?new=1 without products:create', async () => {
    mockApi(
      (request, url) => {
        if (url.pathname === '/v1/products' && request.method === 'GET') return jsonResponse([]);
        return undefined;
      },
      makeMe(['products:read']),
    );
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
      </Routes>,
      { route: '/products?new=1' },
    );
    // A level-2 heading (no skipped level after the page heading) that does not read like an
    // empty installation.
    expect(
      await screen.findByRole('heading', { level: 2, name: 'No products for you yet' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ask a platform administrator for access/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a slug the server refuses at the field and keeps the dialog open', async () => {
    mockApi(
      (request, url) => {
        if (url.pathname === '/v1/products' && request.method === 'GET') return jsonResponse([]);
        if (request.method === 'POST')
          return jsonResponse(
            {
              code: 'validation_failed',
              status: 422,
              errors: [{ loc: ['body', 'slug'], msg: 'slug already taken', type: 'value_error' }],
              request_id: 'r-422',
            },
            { status: 422 },
          );
        return undefined;
      },
      makeMe(['products:create']),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.session, { csrf_token: 'csrf-1' });
    renderWithProviders(<ProductsPage />, { route: '/products', queryClient });
    const user = userEvent.setup();
    // The empty state offers the first step to an admin.
    expect(await screen.findByRole('heading', { name: 'No products yet' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'New product' })[0]!);
    const dialog = await screen.findByRole('dialog', { name: 'Create product' });
    await user.type(within(dialog).getByRole('textbox', { name: /^Name/ }), 'Taken');
    await user.click(within(dialog).getByRole('button', { name: 'Create product' }));
    await waitFor(() =>
      expect(within(dialog).getByRole('textbox', { name: /^Slug/ })).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
    expect(within(dialog).getByText(/slug already taken/)).toBeInTheDocument();
  });

  it('offers no creation in single-product mode and explains why', async () => {
    render(['products:create', 'products:read'], 'single');
    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New product' })).not.toBeInTheDocument();
    expect(screen.getByText('Single-product mode')).toBeInTheDocument();
  });

  it('tells a user without products whom to ask', async () => {
    render(['products:read'], 'multi', []);
    expect(await screen.findByText(/Ask a platform administrator for access/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New product' })).not.toBeInTheDocument();
  });
});
