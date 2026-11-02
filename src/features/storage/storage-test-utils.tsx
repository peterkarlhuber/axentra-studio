/* Test-only helpers for the Data & Storage pages (imported by *.test.tsx files only). */
import { QueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router';
import { vi } from 'vitest';
import { configureApi } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import type { FileInfo, Me, Product } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { ProductScopeContext } from '@/app/contexts';
import { productAccess } from '@/app/permissions';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';

export const PRODUCT_ID = 'prd_1';
export const TENANT_ID = 'ten_1';

export const product = { id: PRODUCT_ID, name: 'Acme', slug: 'acme' } as Product;
export const tenant = {
  id: TENANT_ID,
  product_id: PRODUCT_ID,
  name: 'Tenant One',
  slug: 'one',
  status: 'active',
  version: 1,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
};

/** A principal with the given product-level and tenant-level permissions. */
export function meWith(productPermissions: string[], tenantPermissions: string[] = []): Me {
  return {
    actor_kind: 'user',
    platform_permissions: [],
    platform_role: null,
    user: null,
    products: [
      {
        product,
        role: 'custom',
        permissions: productPermissions,
        tenants: [{ tenant, role: 'custom', permissions: tenantPermissions }],
      },
    ],
  } as unknown as Me;
}

export function fileInfo(overrides: Partial<FileInfo> = {}): FileInfo {
  return {
    id: 'fil_1',
    product_id: PRODUCT_ID,
    tenant_id: TENANT_ID,
    name: 'report.pdf',
    content_type: 'application/pdf',
    size: 2048,
    sha256: 'ab'.repeat(32),
    metadata: { kind: 'invoice' },
    status: 'active',
    version: 3,
    created_by: 'usr_1',
    created_at: '2026-10-30T10:00:00Z',
    updated_at: '2026-10-30T10:00:00Z',
    expires_at: null,
    ...overrides,
  } as FileInfo;
}

export const usage = {
  product_id: PRODUCT_ID,
  tenant_id: TENANT_ID,
  bytes_used: 2048,
  files_used: 1,
  quota_bytes: 1024 ** 3,
  quota_files: null,
  quota_bytes_override: null,
  quota_files_override: null,
  quota_version: 0,
};

export type Handler = (
  request: Request,
  url: URL,
) => Response | undefined | Promise<Response | undefined>;

/** Point the API client at a fake fetch; unknown requests answer 404 problem+json. */
export function mockApi(handler: Handler) {
  const calls: Request[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      calls.push(request.clone());
      const url = new URL(request.url);
      if (url.pathname.endsWith('/tenants') && request.method === 'GET') {
        return jsonResponse({ items: [tenant], next_cursor: null });
      }
      const response = await handler(request, url);
      return (
        response ??
        jsonResponse({ code: 'not_found', status: 404, title: 'Not found' }, { status: 404 })
      );
    },
  });
  return calls;
}

export function renderPage(
  page: ReactElement,
  { me, route, modules }: { me: Me; route: string; modules?: string[] },
) {
  // Keep seeded session/me data alive (the shared test client uses gcTime 0).
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  setCsrfToken('csrf-1');
  queryClient.setQueryData(queryKeys.session, { csrf_token: 'csrf-1' });
  queryClient.setQueryData(queryKeys.me, me);
  const meta = {
    ...testMeta,
    modules: modules ?? [...testMeta.modules, 'storage'],
  };
  return renderWithProviders(
    <ProductScopeContext.Provider
      value={{ productId: PRODUCT_ID, product, access: productAccess(me, PRODUCT_ID) }}
    >
      <Routes>
        <Route path="/p/:productId/*" element={page} />
      </Routes>
    </ProductScopeContext.Provider>,
    { route, queryClient, meta },
  );
}

export interface SentUpload {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: FormData;
  withCredentials: boolean;
}

/**
 * Minimal XMLHttpRequest stand-in for the upload helper. `respond` decides the answer;
 * progress is reported once at 50 % before the response.
 */
export function installFakeXhr(respond: (sent: SentUpload) => { status: number; body: unknown }) {
  const sent: SentUpload[] = [];
  class FakeXhr {
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    withCredentials = false;
    status = 0;
    responseText = '';
    private method = '';
    private url = '';
    private headers: Record<string, string> = {};
    open(method: string, url: string) {
      this.method = method;
      this.url = url;
    }
    setRequestHeader(name: string, value: string) {
      this.headers[name] = value;
    }
    getResponseHeader(name: string) {
      return name.toLowerCase() === 'x-request-id' ? 'req-upload-1' : null;
    }
    abort() {
      this.onabort?.();
    }
    send(body: FormData) {
      const request = {
        method: this.method,
        url: this.url,
        headers: this.headers,
        body,
        withCredentials: this.withCredentials,
      };
      sent.push(request);
      const file = body.get('file') as File;
      setTimeout(() => {
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: file.size / 2,
          total: file.size,
        } as ProgressEvent);
        const answer = respond(request);
        this.status = answer.status;
        this.responseText = JSON.stringify(answer.body);
        this.onload?.();
      }, 0);
    }
  }
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
  return sent;
}
