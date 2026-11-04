import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import type { Meta, Product } from '@/api/models';
import { jsonResponse, makeMe, mockApi, resetApi } from '@/features/billing/test-helpers';
import { ProductDetailPage } from '@/features/products/ProductDetailPage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { renderWithProviders, testMeta } from '@/test/utils';
import { useProductScope } from './contexts';
import { HomeRedirect, ProductScope } from './guards';
import { ProductSwitcher } from './shell/ProductSwitcher';

/**
 * Single-product mode (`meta.mode = "single"`, Axentra docs/architecture/DEPLOYMENT_MODELS.md):
 * Studio opens in the configured product and offers no product switcher, creation or archiving.
 */
const product: Product = {
  id: 'prd_single',
  slug: 'crm',
  name: 'Acme CRM',
  description: '',
  status: 'active',
  settings: {},
  version: 1,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
} as unknown as Product;

const singleMeta: Meta = { ...testMeta, mode: 'single', product };
const multiMeta: Meta = { ...testMeta, mode: 'multi', product: null };

const PLATFORM_ADMIN = makeMe(['products:create', 'products:archive', 'product:manage']);

function productsApi(products: Product[] = [product]) {
  return mockApi((request, url) => {
    if (url.pathname === '/v1/products' && request.method === 'GET') {
      return jsonResponse(products);
    }
    const match = /^\/v1\/products\/([^/]+)$/.exec(url.pathname);
    if (match && request.method === 'GET') {
      const found = products.find((candidate) => candidate.id === match[1]);
      return found ? jsonResponse(found) : undefined; // undefined -> 404 problem
    }
    if (url.pathname.endsWith('/members')) return jsonResponse({ items: [], next_cursor: null });
    return undefined;
  }, PLATFORM_ADMIN);
}

afterEach(resetApi);

describe('single-product mode', { timeout: 20_000 }, () => {
  it('shows the product as a static label instead of a switcher', async () => {
    productsApi([product, { ...product, id: 'prd_other', name: 'Legacy' } as Product]);
    renderWithProviders(<ProductSwitcher productId="prd_single" />, { meta: singleMeta });
    expect(await screen.findByText('Acme CRM')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Switch product/ })).not.toBeInTheDocument();
    expect(screen.queryByText('All products')).not.toBeInTheDocument();
  });

  it('keeps the switcher in multi-product mode', async () => {
    productsApi();
    renderWithProviders(<ProductSwitcher productId="prd_single" />, { meta: multiMeta });
    expect(await screen.findByRole('button', { name: /Switch product/ })).toBeInTheDocument();
  });

  it('opens the configured product from /', async () => {
    productsApi();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/p/:productId/dashboard" element={<p>dashboard of the product</p>} />
        <Route path="/products" element={<p>product list</p>} />
      </Routes>,
      { meta: singleMeta, route: '/' },
    );
    expect(await screen.findByText('dashboard of the product')).toBeInTheDocument();
  });

  it('redirects an unknown product id to the same section of the one product', async () => {
    productsApi();
    renderWithProviders(
      <Routes>
        <Route path="/p/:productId" element={<ProductScope />}>
          <Route path="tenants" element={<ScopeProbe />} />
        </Route>
      </Routes>,
      { meta: singleMeta, route: '/p/prd_gone/tenants' },
    );
    expect(await screen.findByText('tenants of prd_single')).toBeInTheDocument();
  });

  it('shows the 404 for an unknown product id in multi-product mode', async () => {
    productsApi();
    renderWithProviders(
      <Routes>
        <Route path="/p/:productId" element={<ProductScope />}>
          <Route path="tenants" element={<ScopeProbe />} />
        </Route>
      </Routes>,
      { meta: multiMeta, route: '/p/prd_gone/tenants' },
    );
    // The error replaces the page: it carries the page heading and leads back to the list.
    expect(await screen.findByRole('heading', { level: 1, name: 'Not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All products' })).toHaveAttribute('href', '/products');
    expect(screen.queryByText(/tenants of/)).not.toBeInTheDocument();
  });

  it('lists the one product read-only and explains why products cannot be created', async () => {
    productsApi();
    renderWithProviders(<ProductsPage />, { meta: singleMeta, route: '/products' });
    expect(await screen.findByRole('link', { name: 'Acme CRM' })).toBeInTheDocument();
    expect(screen.getByText('Single-product mode')).toBeInTheDocument();
    expect(screen.getByText(/Products cannot be created, archived or restored/)).toBeVisible();
    // The platform admin holds products:create, but the mode refuses it (409 mode_not_supported).
    expect(screen.queryByRole('button', { name: 'New product' })).not.toBeInTheDocument();
  });

  it('offers product creation to platform admins in multi-product mode', async () => {
    productsApi();
    renderWithProviders(<ProductsPage />, { meta: multiMeta, route: '/products' });
    expect(await screen.findByRole('button', { name: 'New product' })).toBeInTheDocument();
    expect(screen.queryByText('Single-product mode')).not.toBeInTheDocument();
  });

  it('offers no archive action on the product and says why', async () => {
    productsApi();
    renderWithProviders(
      <Routes>
        <Route path="/products/:productId" element={<ProductDetailPage />} />
      </Routes>,
      { meta: singleMeta, route: '/products/prd_single' },
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Acme CRM' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
    expect(await screen.findByText(/so this product cannot be archived/)).toBeInTheDocument();
  });

  it('offers archiving in multi-product mode', async () => {
    productsApi();
    renderWithProviders(
      <Routes>
        <Route path="/products/:productId" element={<ProductDetailPage />} />
      </Routes>,
      { meta: multiMeta, route: '/products/prd_single' },
    );
    expect(await screen.findByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.queryByText(/so this product cannot be archived/)).not.toBeInTheDocument();
  });
});

function ScopeProbe() {
  const { productId } = useProductScope();
  return <p>tenants of {productId}</p>;
}
