import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import type { Meta } from '@/api/models';
import { MetaContext } from '@/app/contexts';
import { ThemeProvider } from '@/app/ThemeProvider';
import { ToastProvider, TooltipProvider } from '@/components/ui';

export const testMeta: Meta = {
  name: 'axentra',
  version: '0.1.0',
  api_version: { major: 1, minor: 0 },
  environment: 'test',
  mode: 'multi',
  modules: ['identity', 'tenancy', 'access', 'data', 'audit'],
  product: null,
  auth: { password: true, oidc: [] },
  setup_required: false,
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  meta?: Meta;
  route?: string;
  queryClient?: QueryClient;
}

/** Render with the providers every page expects (query, theme, toast, tooltip, router). */
export function renderWithProviders(
  ui: ReactElement,
  { meta = testMeta, route = '/', queryClient = createTestQueryClient(), ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <ToastProvider>
              <MetaContext.Provider value={meta}>
                <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
              </MetaContext.Provider>
            </ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** JSON response helper for fetch mocks. */
export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
}
