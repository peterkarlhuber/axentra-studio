/**
 * Typed wrappers around the Phase-1 endpoints of the Axentra API v1.
 *
 * Every function maps 1:1 to one operation of `api/openapi.json`; the generated `paths`
 * type checks the path, parameters and request bodies here, in one place.
 */
import { api, apiUrl, unwrap } from './client';
import type {
  ApiKey,
  ApiKeyInput,
  AuditEvent,
  AuthSession,
  CollectionStats,
  DataRecord,
  Health,
  Invitation,
  InvitationInput,
  Me,
  MemberInput,
  MePatch,
  Meta,
  NewApiKey,
  NewInvitation,
  Page,
  PasswordChangeInput,
  PasswordLoginInput,
  Permission,
  Product,
  ProductInput,
  ProductMember,
  ProductOverview,
  ProductPatch,
  RevokeResult,
  Role,
  RoleInput,
  RolePatch,
  ServerSettings,
  SetupInput,
  Tenant,
  TenantInput,
  TenantMember,
  TenantPatch,
  User,
  UserPatch,
  UserSession,
  // Events & Jobs
  DomainEvent,
  EventInput,
  Job,
  JobInput,
  JobStats,
  JobStatus,
  NewWebhookSecret,
  Schedule,
  ScheduleInput,
  SchedulePatch,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEndpoint,
  WebhookInput,
  WebhookPatch,
} from './models';

export interface ListParams {
  limit?: number;
  cursor?: string | null;
  [filter: string]: unknown;
}

/** Drop empty filters so URLs stay clean and the server sees only real constraints. */
export function cleanQuery<T extends Record<string, unknown>>(params: T | undefined): Partial<T> {
  const query: Record<string, unknown> = {};
  if (!params) return query as Partial<T>;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query[key] = value;
  }
  return query as Partial<T>;
}

/** Accept a list envelope or a bare array. */
export function asItems<T>(value: Page<T> | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : (value.items ?? []);
}

/** `If-Match` for optimistic concurrency (API_CONVENTIONS); omitted when unknown. */
function ifMatch(version: number | undefined): { 'If-Match'?: string } {
  return version === undefined ? {} : { 'If-Match': String(version) };
}

// ---- Meta and health -------------------------------------------------------------------

/** A 503 from a health endpoint still carries the `Health` body with per-check results. */
async function health(request: () => Promise<FetchResultLike>): Promise<Health> {
  return unwrap<Health>(
    request().then((result) => {
      const body = result.error as Partial<Health> | undefined;
      if (result.response.status === 503 && body && typeof body === 'object' && 'checks' in body) {
        return { data: body, response: result.response };
      }
      return result;
    }),
  );
}

interface FetchResultLike {
  data?: unknown;
  error?: unknown;
  response: Response;
}

export const metaApi = {
  get: () => unwrap<Meta>(api().GET('/v1/meta')),
  ready: () => health(() => api().GET('/v1/health/ready')),
  live: () => health(() => api().GET('/v1/health/live')),
};

// ---- Auth ------------------------------------------------------------------------------

export const authApi = {
  setup: (body: SetupInput) => unwrap<AuthSession>(api().POST('/v1/auth/setup', { body })),
  loginPassword: (body: PasswordLoginInput) =>
    unwrap<AuthSession>(api().POST('/v1/auth/login/password', { body })),
  session: () => unwrap<AuthSession>(api().GET('/v1/auth/session')),
  logout: () => unwrap<unknown>(api().POST('/v1/auth/logout')),
  sessions: () => unwrap<UserSession[]>(api().GET('/v1/auth/sessions')),
  revokeSession: (sessionId: string) =>
    unwrap<unknown>(
      api().DELETE('/v1/auth/sessions/{session_id}', {
        params: { path: { session_id: sessionId } },
      }),
    ),
};

// ---- Me --------------------------------------------------------------------------------

export const meApi = {
  get: () => unwrap<Me>(api().GET('/v1/me')),
  update: (body: MePatch) => unwrap<User>(api().PATCH('/v1/me', { body })),
  changePassword: (body: PasswordChangeInput) =>
    unwrap<unknown>(api().POST('/v1/me/password', { body })),
};

// ---- Products --------------------------------------------------------------------------

const productPath = (productId: string) => ({ path: { product_id: productId } });

export const productsApi = {
  list: () => unwrap<Product[]>(api().GET('/v1/products')),
  create: (body: ProductInput) => unwrap<Product>(api().POST('/v1/products', { body })),
  get: (productId: string) =>
    unwrap<Product>(api().GET('/v1/products/{product_id}', { params: productPath(productId) })),
  update: (productId: string, body: ProductPatch, version?: number) =>
    unwrap<Product>(
      api().PATCH('/v1/products/{product_id}', {
        params: { ...productPath(productId), header: ifMatch(version) },
        body,
      }),
    ),
  archive: (productId: string) =>
    unwrap<Product>(
      api().POST('/v1/products/{product_id}/archive', { params: productPath(productId) }),
    ),
  restore: (productId: string) =>
    unwrap<Product>(
      api().POST('/v1/products/{product_id}/restore', { params: productPath(productId) }),
    ),
  overview: (productId: string) =>
    unwrap<ProductOverview>(
      api().GET('/v1/products/{product_id}/overview', { params: productPath(productId) }),
    ),
  members: (productId: string) =>
    unwrap<ProductMember[]>(
      api().GET('/v1/products/{product_id}/members', { params: productPath(productId) }),
    ),
  addMember: (productId: string, body: MemberInput) =>
    unwrap<ProductMember>(
      api().POST('/v1/products/{product_id}/members', { params: productPath(productId), body }),
    ),
  updateMember: (productId: string, userId: string, role: string) =>
    unwrap<ProductMember>(
      api().PATCH('/v1/products/{product_id}/members/{user_id}', {
        params: { path: { product_id: productId, user_id: userId } },
        body: { role },
      }),
    ),
  removeMember: (productId: string, userId: string) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/members/{user_id}', {
        params: { path: { product_id: productId, user_id: userId } },
      }),
    ),
};

// ---- Tenants ---------------------------------------------------------------------------

const tenantPath = (productId: string, tenantId: string) => ({
  path: { product_id: productId, tenant_id: tenantId },
});

export interface TenantListParams extends ListParams {
  q?: string;
  status?: 'active' | 'suspended' | '';
}

export const tenantsApi = {
  list: (productId: string, params?: TenantListParams) =>
    unwrap<Page<Tenant>>(
      api().GET('/v1/products/{product_id}/tenants', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as {
            q?: string;
            status?: 'active' | 'suspended';
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  create: (productId: string, body: TenantInput) =>
    unwrap<Tenant>(
      api().POST('/v1/products/{product_id}/tenants', { params: productPath(productId), body }),
    ),
  get: (productId: string, tenantId: string) =>
    unwrap<Tenant>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  update: (productId: string, tenantId: string, body: TenantPatch, version?: number) =>
    unwrap<Tenant>(
      api().PATCH('/v1/products/{product_id}/tenants/{tenant_id}', {
        params: { ...tenantPath(productId, tenantId), header: ifMatch(version) },
        body,
      }),
    ),
  remove: (productId: string, tenantId: string) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/tenants/{tenant_id}', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  members: (productId: string, tenantId: string) =>
    unwrap<TenantMember[]>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/members', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  addMember: (productId: string, tenantId: string, body: MemberInput) =>
    unwrap<TenantMember>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/members', {
        params: tenantPath(productId, tenantId),
        body,
      }),
    ),
  updateMember: (productId: string, tenantId: string, userId: string, role: string) =>
    unwrap<TenantMember>(
      api().PATCH('/v1/products/{product_id}/tenants/{tenant_id}/members/{user_id}', {
        params: { path: { product_id: productId, tenant_id: tenantId, user_id: userId } },
        body: { role },
      }),
    ),
  removeMember: (productId: string, tenantId: string, userId: string) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/tenants/{tenant_id}/members/{user_id}', {
        params: { path: { product_id: productId, tenant_id: tenantId, user_id: userId } },
      }),
    ),
  invitations: (productId: string, tenantId: string) =>
    unwrap<Invitation[]>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/invitations', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  invite: (productId: string, tenantId: string, body: InvitationInput) =>
    unwrap<NewInvitation>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/invitations', {
        params: tenantPath(productId, tenantId),
        body,
      }),
    ),
  revokeInvitation: (productId: string, tenantId: string, invitationId: string) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/tenants/{tenant_id}/invitations/{invitation_id}', {
        params: {
          path: { product_id: productId, tenant_id: tenantId, invitation_id: invitationId },
        },
      }),
    ),
};

export const invitationsApi = {
  accept: (token: string) =>
    unwrap<TenantMember>(api().POST('/v1/invitations/accept', { body: { token } })),
};

// ---- Users -----------------------------------------------------------------------------

const userPath = (userId: string) => ({ path: { user_id: userId } });

export interface UserListParams extends ListParams {
  product_id?: string;
  q?: string;
  status?: 'active' | 'disabled' | '';
}

export const usersApi = {
  list: (params?: UserListParams) =>
    unwrap<Page<User>>(
      api().GET('/v1/users', {
        params: {
          query: cleanQuery(params) as {
            product_id?: string;
            q?: string;
            status?: 'active' | 'disabled';
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  get: (userId: string) =>
    unwrap<User>(api().GET('/v1/users/{user_id}', { params: userPath(userId) })),
  update: (userId: string, body: UserPatch) =>
    unwrap<User>(api().PATCH('/v1/users/{user_id}', { params: userPath(userId), body })),
  sessions: (userId: string) =>
    unwrap<UserSession[]>(api().GET('/v1/users/{user_id}/sessions', { params: userPath(userId) })),
  revokeSessions: (userId: string) =>
    unwrap<RevokeResult>(
      api().POST('/v1/users/{user_id}/sessions/revoke', { params: userPath(userId) }),
    ),
};

// ---- Access ----------------------------------------------------------------------------

const keyPath = (productId: string, keyId: string) => ({
  path: { product_id: productId, key_id: keyId },
});

export const accessApi = {
  permissions: () => unwrap<Permission[]>(api().GET('/v1/permissions')),
  roles: (productId: string) =>
    unwrap<Role[]>(
      api().GET('/v1/products/{product_id}/roles', { params: productPath(productId) }),
    ),
  createRole: (productId: string, body: RoleInput) =>
    unwrap<Role>(
      api().POST('/v1/products/{product_id}/roles', { params: productPath(productId), body }),
    ),
  updateRole: (productId: string, roleId: string, body: RolePatch, version?: number) =>
    unwrap<Role>(
      api().PATCH('/v1/products/{product_id}/roles/{role_id}', {
        params: { path: { product_id: productId, role_id: roleId }, header: ifMatch(version) },
        body,
      }),
    ),
  deleteRole: (productId: string, roleId: string) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/roles/{role_id}', {
        params: { path: { product_id: productId, role_id: roleId } },
      }),
    ),
  apiKeys: (productId: string) =>
    unwrap<ApiKey[]>(
      api().GET('/v1/products/{product_id}/api-keys', { params: productPath(productId) }),
    ),
  createApiKey: (productId: string, body: ApiKeyInput) =>
    unwrap<NewApiKey>(
      api().POST('/v1/products/{product_id}/api-keys', { params: productPath(productId), body }),
    ),
  apiKey: (productId: string, keyId: string) =>
    unwrap<ApiKey>(
      api().GET('/v1/products/{product_id}/api-keys/{key_id}', {
        params: keyPath(productId, keyId),
      }),
    ),
  rotateApiKey: (productId: string, keyId: string, graceSeconds = 0) =>
    unwrap<NewApiKey>(
      api().POST('/v1/products/{product_id}/api-keys/{key_id}/rotate', {
        params: keyPath(productId, keyId),
        body: { grace_seconds: graceSeconds },
      }),
    ),
  revokeApiKey: (productId: string, keyId: string) =>
    unwrap<ApiKey>(
      api().POST('/v1/products/{product_id}/api-keys/{key_id}/revoke', {
        params: keyPath(productId, keyId),
      }),
    ),
};

// ---- Records ---------------------------------------------------------------------------

export type RecordSort = 'id' | '-id' | 'created_at' | '-created_at' | 'updated_at' | '-updated_at';

export interface RecordListParams extends ListParams {
  /** Containment filter, serialized as the JSON object the API expects. */
  where?: Record<string, unknown>;
  sort?: RecordSort;
}

export const recordsApi = {
  collections: (productId: string) =>
    unwrap<CollectionStats[]>(
      api().GET('/v1/products/{product_id}/collections', { params: productPath(productId) }),
    ),
  list: (
    productId: string,
    tenantId: string,
    collection: string,
    params: RecordListParams = {},
  ) => {
    const { where, ...rest } = params;
    const query = cleanQuery({
      ...rest,
      where: where && Object.keys(where).length > 0 ? JSON.stringify(where) : undefined,
    });
    return unwrap<Page<DataRecord>>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/records/{collection}', {
        params: {
          path: { product_id: productId, tenant_id: tenantId, collection },
          query: query as { where?: string; sort?: RecordSort; limit?: number; cursor?: string },
        },
      }),
    );
  },
  get: (productId: string, tenantId: string, collection: string, recordId: string) =>
    unwrap<DataRecord>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/records/{collection}/{record_id}', {
        params: {
          path: { product_id: productId, tenant_id: tenantId, collection, record_id: recordId },
        },
      }),
    ),
};

// ---- Audit and settings ----------------------------------------------------------------

export interface AuditListParams extends ListParams {
  product_id?: string;
  tenant_id?: string;
  action?: string;
  actor_id?: string;
  outcome?: 'success' | 'denied' | 'failure' | '';
  since?: string;
  until?: string;
  q?: string;
}

export const auditApi = {
  list: (params?: AuditListParams) =>
    unwrap<Page<AuditEvent>>(
      api().GET('/v1/audit', {
        params: {
          query: cleanQuery(params) as Omit<AuditListParams, 'outcome' | 'cursor'> & {
            outcome?: 'success' | 'denied' | 'failure';
            cursor?: string;
          },
        },
      }),
    ),
  get: (eventId: string) =>
    unwrap<AuditEvent>(
      api().GET('/v1/audit/{event_id}', { params: { path: { event_id: eventId } } }),
    ),
};

export const settingsApi = {
  get: () => unwrap<ServerSettings>(api().GET('/v1/settings')),
};

// ---- Events & Jobs (module `events`) ---------------------------------------------------

export interface JobListParams extends ListParams {
  status?: JobStatus | '';
  kind?: string;
  tenant_id?: string;
}

export interface EventListParams extends ListParams {
  /** Exact type, or a prefix ending in `*`. */
  type?: string;
  tenant_id?: string;
}

export interface DeliveryListParams extends ListParams {
  status?: WebhookDeliveryStatus | '';
}

const jobPath = (productId: string, jobId: string) => ({
  path: { product_id: productId, job_id: jobId },
});
const schedulePath = (productId: string, scheduleId: string) => ({
  path: { product_id: productId, schedule_id: scheduleId },
});
const webhookPath = (productId: string, webhookId: string) => ({
  path: { product_id: productId, webhook_id: webhookId },
});
const deliveryPath = (productId: string, webhookId: string, deliveryId: string) => ({
  path: { product_id: productId, webhook_id: webhookId, delivery_id: deliveryId },
});

export const jobsApi = {
  list: (productId: string, params?: JobListParams) =>
    unwrap<Page<Job>>(
      api().GET('/v1/products/{product_id}/jobs', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as {
            status?: JobStatus;
            kind?: string;
            tenant_id?: string;
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  stats: (productId: string) =>
    unwrap<JobStats>(
      api().GET('/v1/products/{product_id}/jobs/stats', { params: productPath(productId) }),
    ),
  get: (productId: string, jobId: string) =>
    unwrap<Job>(
      api().GET('/v1/products/{product_id}/jobs/{job_id}', { params: jobPath(productId, jobId) }),
    ),
  enqueue: (productId: string, body: JobInput, idempotencyKey?: string) =>
    unwrap<Job>(
      api().POST('/v1/products/{product_id}/jobs', {
        params: {
          ...productPath(productId),
          header: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
        },
        body,
      }),
    ),
  retry: (productId: string, jobId: string) =>
    unwrap<Job>(
      api().POST('/v1/products/{product_id}/jobs/{job_id}/retry', {
        params: jobPath(productId, jobId),
      }),
    ),
  cancel: (productId: string, jobId: string) =>
    unwrap<Job>(
      api().POST('/v1/products/{product_id}/jobs/{job_id}/cancel', {
        params: jobPath(productId, jobId),
      }),
    ),
};

export const schedulesApi = {
  list: (productId: string, params?: ListParams) =>
    unwrap<Page<Schedule>>(
      api().GET('/v1/products/{product_id}/schedules', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as { tenant_id?: string; limit?: number; cursor?: string },
        },
      }),
    ),
  get: (productId: string, scheduleId: string) =>
    unwrap<Schedule>(
      api().GET('/v1/products/{product_id}/schedules/{schedule_id}', {
        params: schedulePath(productId, scheduleId),
      }),
    ),
  create: (productId: string, body: ScheduleInput) =>
    unwrap<Schedule>(
      api().POST('/v1/products/{product_id}/schedules', { params: productPath(productId), body }),
    ),
  update: (productId: string, scheduleId: string, body: SchedulePatch, version?: number) =>
    unwrap<Schedule>(
      api().PATCH('/v1/products/{product_id}/schedules/{schedule_id}', {
        params: { ...schedulePath(productId, scheduleId), header: ifMatch(version) },
        body,
      }),
    ),
  remove: (productId: string, scheduleId: string, version?: number) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/schedules/{schedule_id}', {
        params: { ...schedulePath(productId, scheduleId), header: ifMatch(version) },
      }),
    ),
};

export const eventsApi = {
  list: (productId: string, params?: EventListParams) =>
    unwrap<Page<DomainEvent>>(
      api().GET('/v1/products/{product_id}/events', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as {
            type?: string;
            tenant_id?: string;
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  get: (productId: string, eventId: string) =>
    unwrap<DomainEvent>(
      api().GET('/v1/products/{product_id}/events/{event_id}', {
        params: { path: { product_id: productId, event_id: eventId } },
      }),
    ),
  publish: (productId: string, tenantId: string, body: EventInput, idempotencyKey?: string) =>
    unwrap<DomainEvent>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/events', {
        params: {
          ...tenantPath(productId, tenantId),
          header: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
        },
        body,
      }),
    ),
  /** URL of the SSE stream (read with `fetch`, see features/events/event-stream.ts). */
  streamUrl: (productId: string, params: { types?: string; tenant_id?: string } = {}) => {
    const query = new URLSearchParams(cleanQuery(params) as Record<string, string>).toString();
    return apiUrl(
      `/v1/products/${encodeURIComponent(productId)}/events/stream${query ? `?${query}` : ''}`,
    );
  },
  jobsStreamUrl: (productId: string) =>
    apiUrl(`/v1/products/${encodeURIComponent(productId)}/jobs/stream`),
};

export const webhooksApi = {
  list: (productId: string, params?: ListParams) =>
    unwrap<Page<WebhookEndpoint>>(
      api().GET('/v1/products/{product_id}/webhooks', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as { limit?: number; cursor?: string },
        },
      }),
    ),
  get: (productId: string, webhookId: string) =>
    unwrap<WebhookEndpoint>(
      api().GET('/v1/products/{product_id}/webhooks/{webhook_id}', {
        params: webhookPath(productId, webhookId),
      }),
    ),
  create: (productId: string, body: WebhookInput) =>
    unwrap<NewWebhookSecret>(
      api().POST('/v1/products/{product_id}/webhooks', { params: productPath(productId), body }),
    ),
  update: (productId: string, webhookId: string, body: WebhookPatch, version?: number) =>
    unwrap<WebhookEndpoint>(
      api().PATCH('/v1/products/{product_id}/webhooks/{webhook_id}', {
        params: { ...webhookPath(productId, webhookId), header: ifMatch(version) },
        body,
      }),
    ),
  remove: (productId: string, webhookId: string, version?: number) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/webhooks/{webhook_id}', {
        params: { ...webhookPath(productId, webhookId), header: ifMatch(version) },
      }),
    ),
  rotateSecret: (productId: string, webhookId: string, graceSeconds = 0) =>
    unwrap<NewWebhookSecret>(
      api().POST('/v1/products/{product_id}/webhooks/{webhook_id}/rotate-secret', {
        params: webhookPath(productId, webhookId),
        body: { grace_seconds: graceSeconds },
      }),
    ),
  test: (productId: string, webhookId: string) =>
    unwrap<WebhookDelivery>(
      api().POST('/v1/products/{product_id}/webhooks/{webhook_id}/test', {
        params: webhookPath(productId, webhookId),
      }),
    ),
  deliveries: (productId: string, webhookId: string, params?: DeliveryListParams) =>
    unwrap<Page<WebhookDelivery>>(
      api().GET('/v1/products/{product_id}/webhooks/{webhook_id}/deliveries', {
        params: {
          ...webhookPath(productId, webhookId),
          query: cleanQuery(params) as {
            status?: WebhookDeliveryStatus;
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  delivery: (productId: string, webhookId: string, deliveryId: string) =>
    unwrap<WebhookDelivery>(
      api().GET('/v1/products/{product_id}/webhooks/{webhook_id}/deliveries/{delivery_id}', {
        params: deliveryPath(productId, webhookId, deliveryId),
      }),
    ),
  redeliver: (productId: string, webhookId: string, deliveryId: string) =>
    unwrap<WebhookDelivery>(
      api().POST(
        '/v1/products/{product_id}/webhooks/{webhook_id}/deliveries/{delivery_id}/redeliver',
        { params: deliveryPath(productId, webhookId, deliveryId) },
      ),
    ),
};
