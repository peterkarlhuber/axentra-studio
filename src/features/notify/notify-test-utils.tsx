/** Test fixtures and a routing fetch mock for the notify pages (used by *.test.tsx only). */
import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router';
import { configureApi } from '@/api/client';
import type {
  Me,
  NotifyMailboxEntry,
  NotifyMessage,
  NotifyStats,
  NotifyTemplate,
} from '@/api/models';
import { ProductScopeContext } from '@/app/contexts';
import { productAccess } from '@/app/permissions';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';

export const PRODUCT = 'prd_1';
export const TENANT = 'ten_1';

export const notifyMeta = { ...testMeta, modules: [...testMeta.modules, 'notify'] };

export function makeMe(permissions: string[]): Me {
  return {
    user: {
      id: 'usr_me',
      email: 'me@example.com',
      name: 'Me',
      status: 'active',
      locale: 'en',
      preferences: {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    actor_kind: 'user',
    platform_role: null,
    platform_permissions: [],
    products: [
      {
        product: { id: PRODUCT, name: 'Prod', slug: 'prod' },
        role: 'product_admin',
        permissions,
        tenants: [],
      },
    ],
  } as unknown as Me;
}

export const template: NotifyTemplate = {
  id: 'tpl_1',
  key: 'welcome',
  product_id: PRODUCT,
  builtin: false,
  category: 'onboarding',
  channel: 'email',
  name: 'Welcome',
  description: '',
  variables: ['name'],
  sample_data: { name: 'Ada' },
  sensitive: false,
  version: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  variants: {
    en: { subject: 'Welcome {{ name }}', text: 'Hi {{ name }}', html: '<p>Hi {{ name }}</p>' },
    de: { subject: 'Willkommen {{ name }}', text: 'Hallo {{ name }}', html: null },
  },
};

export const builtinTemplate: NotifyTemplate = {
  ...template,
  id: null,
  key: 'invitation',
  name: 'Tenant invitation',
  builtin: true,
  version: 0,
  category: 'transactional',
  sensitive: true,
};

export function makeMessage(patch: Partial<NotifyMessage> = {}): NotifyMessage {
  return {
    id: 'msg_1',
    product_id: PRODUCT,
    tenant_id: TENANT,
    template_key: 'welcome',
    template_version: 3,
    channel: 'email',
    category: 'onboarding',
    recipient: 'ada@example.com',
    recipient_user_id: null,
    locale: 'en',
    status: 'failed',
    attempts: 5,
    max_attempts: 5,
    next_attempt_at: null,
    last_error: 'smtp 550 [redacted]',
    provider: 'local',
    provider_message_id: null,
    idempotency_key: null,
    created_by: 'usr_me',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    sent_at: null,
    content_state: 'available',
    ...patch,
  };
}

export const stats: NotifyStats = {
  product_id: PRODUCT,
  tenant_id: null,
  provider: 'local',
  total: { queued: 1, sending: 0, sent: 7, failed: 2, suppressed: 0 },
  last_24h: { queued: 1, sending: 0, sent: 3, failed: 1, suppressed: 0 },
  oldest_queued_at: '2026-01-02T00:00:00Z',
  attempts_24h: 12,
};

export const mailboxEntry: NotifyMailboxEntry = {
  id: 'mbx_1',
  message_id: 'msg_2',
  product_id: PRODUCT,
  tenant_id: TENANT,
  sender: 'Axentra <no-reply@localhost>',
  recipient: 'ada@example.com',
  subject: 'Welcome Ada',
  text: 'Hi Ada',
  html: '<p>Hi Ada</p>',
  provider_message_id: '<msg-2@localhost>',
  created_at: '2026-01-02T00:00:00Z',
};

export type Handler = (
  request: Request,
  url: URL,
) => Response | undefined | Promise<Response | undefined>;

/** Routes requests: the session and /v1/me always answer; `handler` gets everything else. */
export function mockApi(me: Me, handler: Handler) {
  const calls: Request[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      calls.push(request.clone());
      const url = new URL(request.url);
      if (url.pathname === '/v1/auth/session') return jsonResponse({ csrf_token: 'csrf' });
      if (url.pathname === '/v1/me') return jsonResponse(me);
      const answer = await handler(request, url);
      return answer ?? jsonResponse({ code: 'not_found', status: 404 }, { status: 404 });
    },
  });
  return calls;
}

export function renderInProduct(
  ui: ReactElement,
  me: Me,
  route = `/p/${PRODUCT}/notifications`,
  path = '/p/:productId/notifications',
) {
  return renderWithProviders(
    <ProductScopeContext.Provider
      value={{ productId: PRODUCT, product: undefined, access: productAccess(me, PRODUCT) }}
    >
      <Routes>
        <Route path={path} element={ui} />
        <Route path="*" element={<p>other route</p>} />
      </Routes>
    </ProductScopeContext.Provider>,
    { route, meta: notifyMeta },
  );
}
