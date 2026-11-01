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
  userSessions: (userId: string) => ['users', userId, 'sessions'] as const,
  roles: (productId: string) => ['products', productId, 'roles'] as const,
  apiKeys: (productId: string, params?: unknown) =>
    ['products', productId, 'api-keys', params ?? {}] as const,
  collections: (productId: string) => ['products', productId, 'collections'] as const,
  records: (productId: string, tenantId: string, collection: string, params?: unknown) =>
    ['products', productId, 'records', tenantId, collection, params ?? {}] as const,
  audit: (params?: unknown) => ['audit', 'list', params ?? {}] as const,
  auditEvent: (eventId: string) => ['audit', eventId] as const,
};
