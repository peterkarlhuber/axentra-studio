/** Central query keys so invalidation stays consistent across features. */
export const queryKeys = {
  meta: ['meta'] as const,
  session: ['auth', 'session'] as const,
  me: ['me'] as const,
  ownSessions: ['auth', 'sessions'] as const,
  health: ['health', 'ready'] as const,
  settings: ['settings'] as const,
  permissions: ['permissions'] as const,
  products: () => ['products', 'list'] as const,
  product: (productId: string) => ['products', productId] as const,
  productOverview: (productId: string) => ['products', productId, 'overview'] as const,
  productMembers: (productId: string) => ['products', productId, 'members'] as const,
  productInvitations: (productId: string) => ['products', productId, 'invitations'] as const,
  tenants: (productId: string, params?: unknown) =>
    ['products', productId, 'tenants', 'list', params ?? {}] as const,
  tenant: (productId: string, tenantId: string) =>
    ['products', productId, 'tenants', tenantId] as const,
  tenantMembers: (productId: string, tenantId: string) =>
    ['products', productId, 'tenants', tenantId, 'members'] as const,
  invitations: (productId: string, tenantId: string) =>
    ['products', productId, 'tenants', tenantId, 'invitations'] as const,
  users: (params?: unknown) => ['users', 'list', params ?? {}] as const,
  user: (userId: string) => ['users', userId] as const,
  userMemberships: (userId: string) => ['users', userId, 'memberships'] as const,
  userSessions: (userId: string) => ['users', userId, 'sessions'] as const,
  roles: (productId: string) => ['products', productId, 'roles'] as const,
  productPermissions: (productId: string, includeRetired = false) =>
    ['products', productId, 'permissions', { includeRetired }] as const,
  storagePolicy: (productId: string) => ['products', productId, 'storage', 'policy'] as const,
  apiKeys: (productId: string, params?: unknown) =>
    ['products', productId, 'api-keys', params ?? {}] as const,
  collections: (productId: string) => ['products', productId, 'collections'] as const,
  records: (productId: string, tenantId: string, collection: string, params?: unknown) =>
    ['products', productId, 'records', tenantId, collection, params ?? {}] as const,
  audit: (params?: unknown) => ['audit', 'list', params ?? {}] as const,
  auditEvent: (eventId: string) => ['audit', eventId] as const,
  // ---- Notifications and monitoring (notify / observability areas) ----
  notifyTemplates: (productId: string) => ['products', productId, 'notify', 'templates'] as const,
  notifyTemplate: (productId: string, key: string) =>
    ['products', productId, 'notify', 'templates', key] as const,
  notifyMessages: (productId: string, params?: unknown) =>
    ['products', productId, 'notify', 'messages', params ?? {}] as const,
  notifyMessage: (productId: string, messageId: string) =>
    ['products', productId, 'notify', 'message', messageId] as const,
  notifyMailbox: (productId: string, params?: unknown) =>
    ['products', productId, 'notify', 'mailbox', params ?? {}] as const,
  notifyStats: (productId: string) => ['products', productId, 'notify', 'stats'] as const,
  notifyPreferences: (productId: string, tenantId?: string) =>
    ['products', productId, 'notify', 'preferences', tenantId ?? ''] as const,
  metrics: (attempt: number) => ['observability', 'metrics', attempt] as const,
  // Events & Jobs (module `events`)
  jobs: (productId: string, params?: unknown) =>
    ['products', productId, 'jobs', 'list', params ?? {}] as const,
  jobStats: (productId: string) => ['products', productId, 'jobs', 'stats'] as const,
  jobKinds: (productId: string, tenantId: string) =>
    ['products', productId, 'jobs', 'kinds', tenantId] as const,
  job: (productId: string, jobId: string) => ['products', productId, 'jobs', jobId] as const,
  schedules: (productId: string) => ['products', productId, 'schedules'] as const,
  events: (productId: string, params?: unknown) =>
    ['products', productId, 'events', 'list', params ?? {}] as const,
  event: (productId: string, eventId: string) =>
    ['products', productId, 'events', eventId] as const,
  webhooks: (productId: string) => ['products', productId, 'webhooks', 'list'] as const,
  webhook: (productId: string, webhookId: string) =>
    ['products', productId, 'webhooks', webhookId] as const,
  deliveries: (productId: string, webhookId: string, params?: unknown) =>
    ['products', productId, 'webhooks', webhookId, 'deliveries', params ?? {}] as const,
  // ---- Data & Storage ----
  files: (productId: string, tenantId: string, params?: unknown) =>
    ['products', productId, 'files', tenantId, 'list', params ?? {}] as const,
  file: (productId: string, tenantId: string, fileId: string) =>
    ['products', productId, 'files', tenantId, fileId] as const,
  tenantStorage: (productId: string, tenantId: string) =>
    ['products', productId, 'storage', tenantId] as const,
  productStorage: (productId: string) => ['products', productId, 'storage', 'product'] as const,
  // ---- Search ----
  search: (productId: string, tenantId: string, params?: unknown) =>
    ['products', productId, 'search', tenantId, 'hits', params ?? {}] as const,
  searchKinds: (productId: string, tenantId: string) =>
    ['products', productId, 'tenants', tenantId, 'search', 'kinds'] as const,
  searchDocument: (productId: string, tenantId: string, kind: string, refId: string) =>
    ['products', productId, 'search', tenantId, 'document', kind, refId] as const,
};

/* ---- Usage & Billing (studio-billing) ---- */
export const usageBillingKeys = {
  meters: (productId: string) => ['products', productId, 'usage', 'meters'] as const,
  productUsageSummary: (productId: string, params?: unknown) =>
    ['products', productId, 'usage', 'summary', params ?? {}] as const,
  productTimeseries: (productId: string, params?: unknown) =>
    ['products', productId, 'usage', 'timeseries', params ?? {}] as const,
  tenantUsage: (productId: string, tenantId: string) =>
    ['products', productId, 'usage', 'tenant', tenantId] as const,
  tenantUsageSummary: (productId: string, tenantId: string, at?: string) =>
    ['products', productId, 'usage', 'tenant', tenantId, 'summary', at ?? 'now'] as const,
  tenantQuotas: (productId: string, tenantId: string) =>
    ['products', productId, 'usage', 'tenant', tenantId, 'quotas'] as const,
  tenantTimeseries: (productId: string, tenantId: string, params?: unknown) =>
    ['products', productId, 'usage', 'tenant', tenantId, 'timeseries', params ?? {}] as const,
  usageEvents: (productId: string, tenantId: string, params?: unknown) =>
    ['products', productId, 'usage', 'tenant', tenantId, 'events', params ?? {}] as const,
  reservation: (productId: string, tenantId: string, reservationId: string) =>
    ['products', productId, 'usage', 'tenant', tenantId, 'reservation', reservationId] as const,
  plans: (productId: string) => ['products', productId, 'billing', 'plans'] as const,
  tenantPlans: (productId: string, tenantId: string) =>
    ['products', productId, 'billing', 'tenant', tenantId, 'plans'] as const,
  subscriptions: (productId: string, params?: unknown) =>
    ['products', productId, 'billing', 'subscriptions', params ?? {}] as const,
  subscription: (productId: string, tenantId: string) =>
    ['products', productId, 'billing', 'tenant', tenantId, 'subscription'] as const,
  entitlements: (productId: string, tenantId: string) =>
    ['products', productId, 'billing', 'tenant', tenantId, 'entitlements'] as const,
};
