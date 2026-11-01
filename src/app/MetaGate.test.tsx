import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApi } from '@/api/client';
import { createTestQueryClient, jsonResponse, testMeta } from '@/test/utils';
import { MetaGate } from './MetaGate';

function renderGate(response: () => Response | Promise<Response>) {
  const fetch = vi.fn(async () => response());
  configureApi({ baseUrl: 'http://axentra.test', fetch });
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MetaGate>
        <p>app content</p>
      </MetaGate>
    </QueryClientProvider>,
  );
  return fetch;
}

afterEach(() => configureApi({ baseUrl: '' }));

describe('MetaGate', () => {
  it('renders the app for a compatible API', async () => {
    const fetch = renderGate(() =>
      jsonResponse({ ...testMeta, api_version: { major: 1, minor: 3 } }),
    );
    expect(await screen.findByText('app content')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('blocks an incompatible major version and shows both versions', async () => {
    renderGate(() => jsonResponse({ ...testMeta, api_version: { major: 2, minor: 0 } }));
    expect(
      await screen.findByRole('heading', { name: 'Incompatible server version' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('shows a retryable error when the API is unreachable', async () => {
    renderGate(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(
      await screen.findByRole('button', { name: 'Try again' }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });
});
