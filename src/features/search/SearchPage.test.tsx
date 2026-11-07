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
import { SearchPage } from './SearchPage';

const BASE = `/v1/products/prd_1/tenants/${TENANT_ID}/search`;
const MODULES = ['identity', 'tenancy', 'access', 'data', 'audit', 'search'];

const hit = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `sdoc_${n}`,
  kind: 'invoice',
  ref_id: `inv-${n}`,
  title: `Invoice ${n} for Acme`,
  metadata: { total: '12.00' },
  rank: 0.5,
  title_highlight: `Invoice ${n} for <mark>Acme</mark>`,
  body_highlight: 'late payment &lt;b&gt; by <mark>Acme</mark> Corp',
  updated_at: '2026-10-30T10:00:00Z',
  ...extra,
});

const indexed = {
  id: 'sdoc_1',
  product_id: 'prd_1',
  tenant_id: TENANT_ID,
  kind: 'invoice',
  ref_id: 'inv-1',
  title: 'Invoice 1 for Acme',
  body: 'Full text of the invoice for Acme.',
  metadata: { total: '12.00' },
  language: 'simple',
  version: 2,
  created_by: 'key_1',
  updated_by: 'key_1',
  created_at: '2026-10-30T10:00:00Z',
  updated_at: '2026-10-30T10:00:00Z',
};

afterEach(() => {
  configureApi({ baseUrl: '' });
  setCsrfToken(null);
});

function api(extra?: Handler) {
  return mockApi(async (request, url) => {
    const answer = await extra?.(request, url);
    if (answer) return answer;
    if (url.pathname === BASE && request.method === 'GET') {
      const cursor = url.searchParams.get('cursor');
      return cursor
        ? jsonResponse({ items: [hit(3)], next_cursor: null })
        : jsonResponse({ items: [hit(1), hit(2)], next_cursor: 'c2' });
    }
    if (url.pathname === `${BASE}/documents/invoice/inv-1` && request.method === 'GET') {
      return jsonResponse(indexed);
    }
    return undefined;
  });
}

const route = (query = '') => `/p/prd_1/search?tenant=${TENANT_ID}${query}`;

describe('SearchPage', () => {
  it('asks for a tenant first and explains the search syntax once one is chosen', async () => {
    api();
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: '/p/prd_1/search',
      modules: MODULES,
    });
    expect(await screen.findByRole('heading', { name: 'Choose a tenant' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search for')).toBeDisabled();
    const user = userEvent.setup();
    await user.selectOptions(await screen.findByLabelText(/^Tenant/), TENANT_ID);
    expect(await screen.findByRole('heading', { name: 'Enter a search' })).toBeInTheDocument();
    expect(screen.getByText('"late payment"')).toBeInTheDocument();
  });

  it('searches with kinds, highlights matches without rendering HTML and loads more', async () => {
    const calls = api();
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: route(),
      modules: MODULES,
    });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Search for'), 'acme -draft');
    await user.type(screen.getByLabelText('Kinds'), 'invoice, note');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    const first = await screen.findByRole('button', { name: 'Invoice 1 for Acme' });
    expect(within(first).getByText('Acme').tagName).toBe('MARK');
    // Escaped markup in the snippet stays text.
    expect(screen.getAllByText(/late payment <b> by/)).toHaveLength(2);
    expect(document.querySelector('b')).toBeNull();
    expect(screen.getByText('Showing 2 results, more are available')).toBeInTheDocument();

    const search = calls.find((call) => new URL(call.url).pathname === BASE);
    const url = new URL(search?.url ?? 'http://x');
    expect(url.searchParams.get('q')).toBe('acme -draft');
    expect(url.searchParams.getAll('kind')).toEqual(['invoice', 'note']);
    expect(url.searchParams.get('limit')).toBe('20');

    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByRole('button', { name: 'Invoice 3 for Acme' })).toBeInTheDocument();
    expect(screen.getByText('3 results')).toBeInTheDocument();
  });

  it('searches word beginnings when asked and keeps the choice in the address', async () => {
    const calls = api();
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: route(),
      modules: MODULES,
    });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Search for'), 'inv');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByRole('button', { name: 'Invoice 1 for Acme' });
    const plain = calls.filter((call) => new URL(call.url).pathname === BASE);
    expect(new URL(plain[0]?.url ?? 'http://x').searchParams.has('match')).toBe(false);

    await user.click(screen.getByRole('checkbox', { name: 'Match word beginnings' }));
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            new URL(call.url).pathname === BASE &&
            new URL(call.url).searchParams.get('match') === 'prefix',
        ),
      ).toBe(true),
    );
    // The form keeps the option after the search (it is read back from the address).
    expect(screen.getByRole('checkbox', { name: 'Match word beginnings' })).toBeChecked();
  });

  it('offers the indexed kinds of the tenant as toggles for the kind filter', async () => {
    const calls = api((_request, url) =>
      url.pathname === `${BASE}/kinds`
        ? jsonResponse([
            { kind: 'invoice', count: 12 },
            { kind: 'note', count: 3 },
          ])
        : undefined,
    );
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: route(),
      modules: MODULES,
    });
    const user = userEvent.setup();
    const group = await screen.findByRole('group', { name: 'Indexed kinds' });
    const note = within(group).getByRole('button', { name: 'note (3)' });
    expect(note).toHaveAttribute('aria-pressed', 'false');
    await user.click(note);
    await user.click(within(group).getByRole('button', { name: 'invoice (12)' }));
    expect(screen.getByLabelText(/^Kinds/)).toHaveValue('note, invoice');
    expect(note).toHaveAttribute('aria-pressed', 'true');
    await user.click(note);
    expect(screen.getByLabelText(/^Kinds/)).toHaveValue('invoice');
    await user.type(screen.getByLabelText('Search for'), 'acme');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByRole('button', { name: 'Invoice 1 for Acme' });
    const search = calls.find((call) => new URL(call.url).pathname === BASE);
    expect(new URL(search?.url ?? 'http://x').searchParams.getAll('kind')).toEqual(['invoice']);
  });

  it('keeps the free-text kind field when the server cannot list kinds', async () => {
    api((_request, url) =>
      url.pathname === `${BASE}/kinds`
        ? jsonResponse({ code: 'conflict', status: 409 }, { status: 409 })
        : undefined,
    );
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: route(),
      modules: MODULES,
    });
    expect(await screen.findByLabelText(/^Kinds/)).toBeEnabled();
    await waitFor(() =>
      expect(screen.queryByRole('group', { name: 'Indexed kinds' })).not.toBeInTheDocument(),
    );
  });

  it('refuses an invalid kind before sending anything', async () => {
    const calls = api();
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: route(),
      modules: MODULES,
    });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Search for'), 'acme');
    await user.type(screen.getByLabelText(/^Kinds/), 'Invoice');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByText(/“Invoice” is not a valid kind/)).toBeInTheDocument();
    expect(calls.some((call) => new URL(call.url).pathname === BASE)).toBe(false);
  });

  it('explains when nothing matches and points to the kind filter', async () => {
    api((_request, url) =>
      url.pathname === BASE ? jsonResponse({ items: [], next_cursor: null }) : undefined,
    );
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: route('&q=nothing&kind=note'),
      modules: MODULES,
    });
    expect(await screen.findByRole('heading', { name: 'No matches' })).toBeInTheDocument();
    expect(screen.getByText(/Remove the kind filter/)).toBeInTheDocument();
    // The URL state fills the form.
    expect(screen.getByLabelText('Search for')).toHaveValue('nothing');
    expect(screen.getByLabelText(/^Kinds/)).toHaveValue('note');
  });

  it('explains a search the server stopped as too expensive and links its help', async () => {
    api((_request, url) =>
      url.pathname === BASE
        ? jsonResponse(
            {
              code: 'validation_failed',
              status: 422,
              detail: 'the search took too long; use more specific terms or a kind filter',
              reason: 'query_too_expensive',
            },
            { status: 422 },
          )
        : undefined,
    );
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: route('&q=the'),
      modules: MODULES,
    });
    const alert = await screen.findByRole('alert');
    expect(
      await within(alert).findByRole('heading', { name: 'Search took too long' }),
    ).toBeInTheDocument();
    expect(within(alert).getByText(/Use more specific terms or a kind filter/)).toBeInTheDocument();
    expect(within(alert).queryByText('Please check your input')).not.toBeInTheDocument();
  });

  it('shows a no-access state without search:query', async () => {
    const calls = api();
    renderPage(<SearchPage />, {
      me: meWith([], ['records:read']),
      route: route('&q=acme'),
      modules: MODULES,
    });
    expect(
      await screen.findByRole('heading', { name: 'You cannot search this tenant' }),
    ).toBeInTheDocument();
    expect(calls.some((call) => new URL(call.url).pathname === BASE)).toBe(false);
  });

  it('opens a document read-only for search:query', async () => {
    api();
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query']),
      route: route('&q=acme'),
      modules: MODULES,
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Invoice 1 for Acme' }));
    const drawer = await screen.findByRole('dialog', { name: 'Invoice 1 for Acme' });
    expect(await within(drawer).findByText('Full text of the invoice for Acme.')).toBeVisible();
    expect(within(drawer).getByText('sdoc_1')).toBeInTheDocument();
    expect(
      within(drawer).queryByRole('button', { name: 'Remove from index' }),
    ).not.toBeInTheDocument();
  });

  it('removes a document from the index after a confirmation and searches again', async () => {
    let removed = false;
    const calls = api((request, url) => {
      if (request.method === 'DELETE' && url.pathname === `${BASE}/documents/invoice/inv-1`) {
        removed = true;
        return new Response(null, { status: 204 });
      }
      if (removed && url.pathname === BASE) {
        return jsonResponse({ items: [hit(2)], next_cursor: null });
      }
      return undefined;
    });
    renderPage(<SearchPage />, {
      me: meWith([], ['search:query', 'search:index']),
      route: route('&q=acme'),
      modules: MODULES,
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Invoice 1 for Acme' }));
    const drawer = await screen.findByRole('dialog', { name: 'Invoice 1 for Acme' });
    await user.click(await within(drawer).findByRole('button', { name: 'Remove from index' }));
    const confirm = await screen.findByRole('dialog', {
      name: 'Remove from the search index?',
    });
    expect(within(confirm).getByText(/The original object in your product is not changed/));
    await user.click(within(confirm).getByRole('button', { name: 'Remove from index' }));
    expect(await screen.findByText('inv-1 removed from the search index')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Invoice 1 for Acme' })).not.toBeInTheDocument(),
    );
    const deletion = calls.find((call) => call.method === 'DELETE');
    expect(deletion?.headers.get('X-Axentra-CSRF')).toBe('csrf-1');
  });
});
