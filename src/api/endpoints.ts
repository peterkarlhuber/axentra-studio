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
  CheckoutInput,
  CheckoutSession,
  CollectionStats,
  EffectiveLimit,
  Entitlements,
  DataRecord,
  DownloadUrl,
  FileInfo,
  FilePatch,
  ProductStorageUsage,
  SearchDocument,
  SearchHit,
  QuotaInput,
  StoragePolicy,
  StoragePolicyInput,
  TenantStorageUsage,
  Health,
  Invitation,
  InvitationInput,
  Me,
  MemberInput,
  MePatch,
  Meta,
  Meter,
  MeterInput,
  MeterPatch,
  MeterUsage,
  NewApiKey,
  NewInvitation,
  OidcStartAnswer,
  OidcStartInput,
  Page,
  PasswordChangeInput,
  PasswordLoginInput,
  Permission,
  Plan,
  PlanInput,
  PlanPatch,
  Product,
  // notify / observability areas
  NotifyDraftPreviewInput,
  NotifyMailboxEntry,
  NotifyMessage,
  NotifyMessageStatus,
  NotifyPreferences,
  NotifyPreviewInput,
  NotifyRendered,
  NotifySendInput,
  NotifyStats,
  NotifyTemplate,
  NotifyTemplateInput,
  NotifyTemplatePatch,
  ProductInput,
  ProductInvitation,
  ProductInvitationInput,
  NewProductInvitation,
  ProductMember,
  ProductOverview,
  ProductPatch,
  UsageQuotaInput,
  Reservation,
  ReservationCommitInput,
  RevokeResult,
  Role,
  RoleInput,
  RolePatch,
  ServerSettings,
  SetupInput,
  Subscription,
  SubscriptionStatus,
  Tenant,
  TenantMeterTotal,
  TenantInput,
  TenantMember,
  TenantPatch,
  TimeSeries,
  UsageEvent,
  UsageRecordInput,
  UsageRecordResult,
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
  /**
   * Single sign-on start with the invitation in the body (never in a URL). Sets the login
   * cookie; the browser then navigates to `redirect_url` (the identity provider).
   */
  oidcStart: (provider: string, body: OidcStartInput) =>
    unwrap<OidcStartAnswer>(
      api().POST('/v1/auth/oidc/{provider}/start', { params: { path: { provider } }, body }),
    ),
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
  /** Invitations to the product team (operators), newest first. */
  invitations: (productId: string) =>
    unwrap<ProductInvitation[]>(
      api().GET('/v1/products/{product_id}/invitations', { params: productPath(productId) }),
    ),
  invite: (productId: string, body: ProductInvitationInput) =>
    unwrap<NewProductInvitation>(
      api().POST('/v1/products/{product_id}/invitations', { params: productPath(productId), body }),
    ),
  revokeInvitation: (productId: string, invitationId: string) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/invitations/{invitation_id}', {
        params: { path: { product_id: productId, invitation_id: invitationId } },
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
  /** A product team invitation (`axpinv_...` token). */
  acceptProduct: (token: string) =>
    unwrap<ProductMember>(api().POST('/v1/product-invitations/accept', { body: { token } })),
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
  /** Everything grantable in the product: built-in product/tenant and product-defined permissions. */
  productPermissions: (productId: string, includeRetired = false) =>
    unwrap<Permission[]>(
      api().GET('/v1/products/{product_id}/permissions', {
        params: {
          ...productPath(productId),
          query: includeRetired ? { include_retired: true } : {},
        },
      }),
    ),
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

// ---- Data & Storage: record writes, files, storage usage and quotas ---------------------

const recordPath = (productId: string, tenantId: string, collection: string, recordId: string) => ({
  path: { product_id: productId, tenant_id: tenantId, collection, record_id: recordId },
});

/** Record writes (`records:write`); replace and delete send `If-Match` with the version. */
export const recordsWriteApi = {
  create: (
    productId: string,
    tenantId: string,
    collection: string,
    data: Record<string, unknown>,
  ) =>
    unwrap<DataRecord>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/records/{collection}', {
        params: { path: { product_id: productId, tenant_id: tenantId, collection } },
        body: data,
      }),
    ),
  replace: (
    productId: string,
    tenantId: string,
    collection: string,
    recordId: string,
    data: Record<string, unknown>,
    version?: number,
  ) =>
    unwrap<DataRecord>(
      api().PUT('/v1/products/{product_id}/tenants/{tenant_id}/records/{collection}/{record_id}', {
        params: {
          ...recordPath(productId, tenantId, collection, recordId),
          header: ifMatch(version),
        },
        body: data,
      }),
    ),
  remove: (
    productId: string,
    tenantId: string,
    collection: string,
    recordId: string,
    version?: number,
  ) =>
    unwrap<unknown>(
      api().DELETE(
        '/v1/products/{product_id}/tenants/{tenant_id}/records/{collection}/{record_id}',
        {
          params: {
            ...recordPath(productId, tenantId, collection, recordId),
            header: ifMatch(version),
          },
        },
      ),
    ),
};

// ---- Search (module `search`) -----------------------------------------------------------

export interface SearchParams extends ListParams {
  q: string;
  /** Restrict to these document kinds (repeatable `kind`, at most 20). */
  kind?: string[];
}

const searchDocumentPath = (productId: string, tenantId: string, kind: string, refId: string) => ({
  path: { product_id: productId, tenant_id: tenantId, kind, ref_id: refId },
});

/** The tenant's full-text index (`docs/modules/SEARCH.md` in the Axentra repository). */
export const searchApi = {
  query: (productId: string, tenantId: string, params: SearchParams) => {
    const { kind, ...rest } = params;
    const query = cleanQuery({ ...rest, kind: kind && kind.length > 0 ? kind : undefined });
    return unwrap<Page<SearchHit>>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/search', {
        params: {
          path: { product_id: productId, tenant_id: tenantId },
          query: query as SearchParams,
        },
      }),
    );
  },
  document: (productId: string, tenantId: string, kind: string, refId: string) =>
    unwrap<SearchDocument>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/search/documents/{kind}/{ref_id}', {
        params: searchDocumentPath(productId, tenantId, kind, refId),
      }),
    ),
  removeDocument: (productId: string, tenantId: string, kind: string, refId: string) =>
    unwrap<unknown>(
      api().DELETE(
        '/v1/products/{product_id}/tenants/{tenant_id}/search/documents/{kind}/{ref_id}',
        { params: searchDocumentPath(productId, tenantId, kind, refId) },
      ),
    ),
};

export type FileSort = 'created_at' | '-created_at' | 'name' | '-name' | 'size' | '-size';

export interface FileListParams extends ListParams {
  q?: string;
  /** Exact type or `type/*`. */
  content_type?: string;
  /** Containment filter on the metadata labels, serialized as JSON. */
  metadata?: Record<string, unknown>;
  created_by?: string;
  sort?: FileSort;
}

const filePath = (productId: string, tenantId: string, fileId: string) => ({
  path: { product_id: productId, tenant_id: tenantId, file_id: fileId },
});

/** Files of one tenant. Uploads go through `uploadFile` (`./upload.ts`) for progress events. */
export const filesApi = {
  list: (productId: string, tenantId: string, params: FileListParams = {}) => {
    const { metadata, ...rest } = params;
    const query = cleanQuery({
      ...rest,
      metadata: metadata && Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined,
    });
    return unwrap<Page<FileInfo>>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/files', {
        params: {
          ...tenantPath(productId, tenantId),
          query: query as {
            q?: string;
            content_type?: string;
            metadata?: string;
            created_by?: string;
            sort?: FileSort;
            limit?: number;
            cursor?: string;
          },
        },
      }),
    );
  },
  get: (productId: string, tenantId: string, fileId: string) =>
    unwrap<FileInfo>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/files/{file_id}', {
        params: filePath(productId, tenantId, fileId),
      }),
    ),
  update: (
    productId: string,
    tenantId: string,
    fileId: string,
    body: FilePatch,
    version?: number,
  ) =>
    unwrap<FileInfo>(
      api().PATCH('/v1/products/{product_id}/tenants/{tenant_id}/files/{file_id}', {
        params: { ...filePath(productId, tenantId, fileId), header: ifMatch(version) },
        body,
      }),
    ),
  remove: (productId: string, tenantId: string, fileId: string, version?: number) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/tenants/{tenant_id}/files/{file_id}', {
        params: { ...filePath(productId, tenantId, fileId), header: ifMatch(version) },
      }),
    ),
  /** Short-lived download URL; without `ttl_seconds` the server uses its maximum. */
  downloadUrl: (productId: string, tenantId: string, fileId: string, ttlSeconds?: number) =>
    unwrap<DownloadUrl>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/files/{file_id}/download-url', {
        params: filePath(productId, tenantId, fileId),
        body: ttlSeconds === undefined ? {} : { ttl_seconds: ttlSeconds },
      }),
    ),
};

export const storageApi = {
  /** All tenants' usage (`collections:read`), tenants paginated by id. */
  productUsage: (productId: string, params?: ListParams) =>
    unwrap<ProductStorageUsage>(
      api().GET('/v1/products/{product_id}/storage/usage', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as { limit?: number; cursor?: string },
        },
      }),
    ),
  tenantUsage: (productId: string, tenantId: string) =>
    unwrap<TenantStorageUsage>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/storage/usage', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  /** The product's effective content-type policy for blocked file types (`product:read`). */
  policy: (productId: string) =>
    unwrap<StoragePolicy>(
      api().GET('/v1/products/{product_id}/storage/policy', { params: productPath(productId) }),
    ),
  /** Replaces the policy keys of `settings.storage`; `If-Match` is the product version. */
  setPolicy: (productId: string, body: StoragePolicyInput, version?: number) =>
    unwrap<StoragePolicy>(
      api().PUT('/v1/products/{product_id}/storage/policy', {
        params: { ...productPath(productId), header: ifMatch(version) },
        body,
      }),
    ),
  /** `null` inherits the product/installation default; `If-Match` is the `quota_version`. */
  setQuota: (productId: string, tenantId: string, body: QuotaInput, version?: number) =>
    unwrap<TenantStorageUsage>(
      api().PUT('/v1/products/{product_id}/tenants/{tenant_id}/storage/quota', {
        params: { ...tenantPath(productId, tenantId), header: ifMatch(version) },
        body,
      }),
    ),
};

// ---- Usage & Billing (studio-billing) --------------------------------------------------

export type UsageRangeParams = {
  /** ISO dates (YYYY-MM-DD), inclusive; the API defaults to the last 30 days. */
  since?: string;
  until?: string;
};

export interface ProductUsageSummaryParams extends ListParams, UsageRangeParams {
  meter?: string;
}

export interface UsageEventListParams extends ListParams {
  meter?: string;
  since?: string;
  until?: string;
}

export interface SubscriptionListParams extends ListParams {
  status?: SubscriptionStatus | '';
  plan?: string;
}

const meterPath = (productId: string, meterId: string) => ({
  path: { product_id: productId, meter_id: meterId },
});
const planPath = (productId: string, planId: string) => ({
  path: { product_id: productId, plan_id: planId },
});
const reservationPath = (productId: string, tenantId: string, reservationId: string) => ({
  path: { product_id: productId, tenant_id: tenantId, reservation_id: reservationId },
});

export const usageApi = {
  meters: (productId: string) =>
    unwrap<Meter[]>(
      api().GET('/v1/products/{product_id}/usage/meters', { params: productPath(productId) }),
    ),
  createMeter: (productId: string, body: MeterInput) =>
    unwrap<Meter>(
      api().POST('/v1/products/{product_id}/usage/meters', {
        params: productPath(productId),
        body,
      }),
    ),
  updateMeter: (productId: string, meterId: string, body: MeterPatch, version?: number) =>
    unwrap<Meter>(
      api().PATCH('/v1/products/{product_id}/usage/meters/{meter_id}', {
        params: { ...meterPath(productId, meterId), header: ifMatch(version) },
        body,
      }),
    ),
  deleteMeter: (productId: string, meterId: string, version?: number) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/usage/meters/{meter_id}', {
        params: { ...meterPath(productId, meterId), header: ifMatch(version) },
      }),
    ),
  productSummary: (productId: string, params?: ProductUsageSummaryParams) =>
    unwrap<Page<TenantMeterTotal>>(
      api().GET('/v1/products/{product_id}/usage/summary', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as {
            since?: string;
            until?: string;
            meter?: string;
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  productTimeseries: (productId: string, meter: string, range?: UsageRangeParams) =>
    unwrap<TimeSeries>(
      api().GET('/v1/products/{product_id}/usage/timeseries', {
        params: { ...productPath(productId), query: { meter, ...cleanQuery(range) } },
      }),
    ),
  record: (productId: string, tenantId: string, body: UsageRecordInput, idempotencyKey: string) =>
    unwrap<UsageRecordResult>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/usage/events', {
        params: {
          ...tenantPath(productId, tenantId),
          header: { 'Idempotency-Key': idempotencyKey },
        },
        body,
      }),
    ),
  events: (productId: string, tenantId: string, params?: UsageEventListParams) =>
    unwrap<Page<UsageEvent>>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/usage/events', {
        params: {
          ...tenantPath(productId, tenantId),
          query: cleanQuery(params) as {
            meter?: string;
            since?: string;
            until?: string;
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  /** `at`: any time inside the wanted period (ISO date-time with zone); default now. */
  tenantSummary: (productId: string, tenantId: string, at?: string) =>
    unwrap<MeterUsage[]>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/usage/summary', {
        params: { ...tenantPath(productId, tenantId), query: cleanQuery({ at }) },
      }),
    ),
  tenantTimeseries: (
    productId: string,
    tenantId: string,
    meter: string,
    range?: UsageRangeParams,
  ) =>
    unwrap<TimeSeries>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/usage/timeseries', {
        params: { ...tenantPath(productId, tenantId), query: { meter, ...cleanQuery(range) } },
      }),
    ),
  quotas: (productId: string, tenantId: string) =>
    unwrap<EffectiveLimit[]>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/usage/quotas', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  setQuota: (productId: string, tenantId: string, meter: string, body: UsageQuotaInput) =>
    unwrap<EffectiveLimit>(
      api().PUT('/v1/products/{product_id}/tenants/{tenant_id}/usage/quotas/{meter}', {
        params: { path: { product_id: productId, tenant_id: tenantId, meter } },
        body,
      }),
    ),
  deleteQuota: (productId: string, tenantId: string, meter: string) =>
    unwrap<EffectiveLimit>(
      api().DELETE('/v1/products/{product_id}/tenants/{tenant_id}/usage/quotas/{meter}', {
        params: { path: { product_id: productId, tenant_id: tenantId, meter } },
      }),
    ),
  reservation: (productId: string, tenantId: string, reservationId: string) =>
    unwrap<Reservation>(
      api().GET(
        '/v1/products/{product_id}/tenants/{tenant_id}/usage/reservations/{reservation_id}',
        { params: reservationPath(productId, tenantId, reservationId) },
      ),
    ),
  commitReservation: (
    productId: string,
    tenantId: string,
    reservationId: string,
    body: ReservationCommitInput,
  ) =>
    unwrap<UsageRecordResult>(
      api().POST(
        '/v1/products/{product_id}/tenants/{tenant_id}/usage/reservations/{reservation_id}/commit',
        { params: reservationPath(productId, tenantId, reservationId), body },
      ),
    ),
  releaseReservation: (productId: string, tenantId: string, reservationId: string) =>
    unwrap<Reservation>(
      api().POST(
        '/v1/products/{product_id}/tenants/{tenant_id}/usage/reservations/{reservation_id}/release',
        { params: reservationPath(productId, tenantId, reservationId) },
      ),
    ),
};

export const billingApi = {
  plans: (productId: string) =>
    unwrap<Plan[]>(
      api().GET('/v1/products/{product_id}/billing/plans', { params: productPath(productId) }),
    ),
  createPlan: (productId: string, body: PlanInput) =>
    unwrap<Plan>(
      api().POST('/v1/products/{product_id}/billing/plans', {
        params: productPath(productId),
        body,
      }),
    ),
  updatePlan: (productId: string, planId: string, body: PlanPatch, version?: number) =>
    unwrap<Plan>(
      api().PATCH('/v1/products/{product_id}/billing/plans/{plan_id}', {
        params: { ...planPath(productId, planId), header: ifMatch(version) },
        body,
      }),
    ),
  deletePlan: (productId: string, planId: string, version?: number) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/billing/plans/{plan_id}', {
        params: { ...planPath(productId, planId), header: ifMatch(version) },
      }),
    ),
  subscriptions: (productId: string, params?: SubscriptionListParams) =>
    unwrap<Page<Subscription>>(
      api().GET('/v1/products/{product_id}/billing/subscriptions', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as {
            status?: SubscriptionStatus;
            plan?: string;
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  tenantPlans: (productId: string, tenantId: string) =>
    unwrap<Plan[]>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/billing/plans', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  subscription: (productId: string, tenantId: string) =>
    unwrap<Subscription>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/billing/subscription', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  subscribe: (productId: string, tenantId: string, plan: string, priceId?: string | null) =>
    unwrap<Subscription>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/billing/subscription', {
        params: tenantPath(productId, tenantId),
        body: { plan, price_id: priceId ?? null },
      }),
    ),
  changePlan: (
    productId: string,
    tenantId: string,
    plan: string,
    priceId: string | null | undefined,
    version?: number,
  ) =>
    unwrap<Subscription>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/billing/subscription/change-plan', {
        params: { ...tenantPath(productId, tenantId), header: ifMatch(version) },
        body: { plan, price_id: priceId ?? null },
      }),
    ),
  cancel: (productId: string, tenantId: string, atPeriodEnd: boolean) =>
    unwrap<Subscription>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/billing/subscription/cancel', {
        params: tenantPath(productId, tenantId),
        body: { at_period_end: atPeriodEnd },
      }),
    ),
  resume: (productId: string, tenantId: string) =>
    unwrap<Subscription>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/billing/subscription/resume', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  setStatus: (productId: string, tenantId: string, status: SubscriptionStatus, version?: number) =>
    unwrap<Subscription>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/billing/subscription/status', {
        params: { ...tenantPath(productId, tenantId), header: ifMatch(version) },
        body: { status },
      }),
    ),
  checkout: (productId: string, tenantId: string, body: CheckoutInput) =>
    unwrap<CheckoutSession>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/billing/checkout', {
        params: tenantPath(productId, tenantId),
        body,
      }),
    ),
  entitlements: (productId: string, tenantId: string) =>
    unwrap<Entitlements>(
      api().GET('/v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements', {
        params: tenantPath(productId, tenantId),
      }),
    ),
  setOverrides: (
    productId: string,
    tenantId: string,
    entitlements: Record<string, boolean | number | null>,
  ) =>
    unwrap<Entitlements>(
      api().PUT('/v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements/overrides', {
        params: tenantPath(productId, tenantId),
        body: { entitlements },
      }),
    ),
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

// ---- Notifications (notify module) -----------------------------------------------------

const templatePath = (productId: string, key: string) => ({
  path: { product_id: productId, key },
});

export interface NotifyMessageListParams extends ListParams {
  tenant_id?: string;
  status?: NotifyMessageStatus | '';
  template_key?: string;
  recipient?: string;
  since?: string;
}

export interface NotifyMailboxParams extends ListParams {
  recipient?: string;
}

export const notifyApi = {
  templates: (productId: string) =>
    unwrap<NotifyTemplate[]>(
      api().GET('/v1/products/{product_id}/notify/templates', { params: productPath(productId) }),
    ),
  template: (productId: string, key: string) =>
    unwrap<NotifyTemplate>(
      api().GET('/v1/products/{product_id}/notify/templates/{key}', {
        params: templatePath(productId, key),
      }),
    ),
  createTemplate: (productId: string, body: NotifyTemplateInput) =>
    unwrap<NotifyTemplate>(
      api().POST('/v1/products/{product_id}/notify/templates', {
        params: productPath(productId),
        body,
      }),
    ),
  updateTemplate: (productId: string, key: string, body: NotifyTemplatePatch, version?: number) =>
    unwrap<NotifyTemplate>(
      api().PATCH('/v1/products/{product_id}/notify/templates/{key}', {
        params: { ...templatePath(productId, key), header: ifMatch(version) },
        body,
      }),
    ),
  deleteTemplate: (productId: string, key: string, version?: number) =>
    unwrap<unknown>(
      api().DELETE('/v1/products/{product_id}/notify/templates/{key}', {
        params: { ...templatePath(productId, key), header: ifMatch(version) },
      }),
    ),
  previewTemplate: (productId: string, key: string, body: NotifyPreviewInput) =>
    unwrap<NotifyRendered>(
      api().POST('/v1/products/{product_id}/notify/templates/{key}/preview', {
        params: templatePath(productId, key),
        body,
      }),
    ),
  previewDraft: (productId: string, body: NotifyDraftPreviewInput) =>
    unwrap<NotifyRendered>(
      api().POST('/v1/products/{product_id}/notify/templates/preview', {
        params: productPath(productId),
        body,
      }),
    ),
  send: (productId: string, tenantId: string, body: NotifySendInput, idempotencyKey: string) =>
    unwrap<NotifyMessage>(
      api().POST('/v1/products/{product_id}/tenants/{tenant_id}/notify/send', {
        params: {
          ...tenantPath(productId, tenantId),
          header: { 'Idempotency-Key': idempotencyKey },
        },
        body,
      }),
    ),
  messages: (productId: string, params?: NotifyMessageListParams) =>
    unwrap<Page<NotifyMessage>>(
      api().GET('/v1/products/{product_id}/notify/messages', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as {
            tenant_id?: string;
            status?: NotifyMessageStatus;
            template_key?: string;
            recipient?: string;
            since?: string;
            limit?: number;
            cursor?: string;
          },
        },
      }),
    ),
  message: (productId: string, messageId: string) =>
    unwrap<NotifyMessage>(
      api().GET('/v1/products/{product_id}/notify/messages/{message_id}', {
        params: { path: { product_id: productId, message_id: messageId } },
      }),
    ),
  retry: (productId: string, messageId: string) =>
    unwrap<NotifyMessage>(
      api().POST('/v1/products/{product_id}/notify/messages/{message_id}/retry', {
        params: { path: { product_id: productId, message_id: messageId } },
      }),
    ),
  mailbox: (productId: string, params?: NotifyMailboxParams) =>
    unwrap<Page<NotifyMailboxEntry>>(
      api().GET('/v1/products/{product_id}/notify/mailbox', {
        params: {
          ...productPath(productId),
          query: cleanQuery(params) as { recipient?: string; limit?: number; cursor?: string },
        },
      }),
    ),
  stats: (productId: string, tenantId?: string) =>
    unwrap<NotifyStats>(
      api().GET('/v1/products/{product_id}/notify/stats', {
        params: { ...productPath(productId), query: cleanQuery({ tenant_id: tenantId }) },
      }),
    ),
  preferences: (productId: string, tenantId?: string) =>
    unwrap<NotifyPreferences>(
      api().GET('/v1/products/{product_id}/notify/preferences/me', {
        params: { ...productPath(productId), query: cleanQuery({ tenant_id: tenantId }) },
      }),
    ),
  setPreferences: (productId: string, optedOut: string[], version?: number, tenantId?: string) =>
    unwrap<NotifyPreferences>(
      api().PUT('/v1/products/{product_id}/notify/preferences/me', {
        params: {
          ...productPath(productId),
          query: cleanQuery({ tenant_id: tenantId }),
          header: ifMatch(version),
        },
        body: { opted_out: optedOut },
      }),
    ),
};

// ---- Observability (GET /metrics, outside /v1) ----------------------------------------

export const observabilityApi = {
  /**
   * Prometheus text exposition. The token is the operator's `observability.metrics_token_ref`
   * value; it is only kept in memory by the caller and sent as a bearer token.
   */
  metrics: (token?: string) =>
    unwrap<string>(
      api().GET('/metrics', {
        parseAs: 'text',
        headers: {
          Accept: 'text/plain',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
    ),
};
