import type { Me, ProductAccess } from '@/api/models';

/**
 * Whether a granted permission covers a required one. Supports exact names, `*` and
 * `resource:*` wildcards (defensive; the server currently grants explicit names).
 */
export function permissionMatches(granted: string, required: string): boolean {
  if (granted === required || granted === '*') return true;
  if (granted.endsWith(':*')) {
    return required.startsWith(granted.slice(0, -1));
  }
  return false;
}

export function hasPermission(granted: readonly string[] | undefined, required: string) {
  return (granted ?? []).some((permission) => permissionMatches(permission, required));
}

export function isPlatformAdmin(me: Pick<Me, 'platform_role'> | null | undefined): boolean {
  return me?.platform_role === 'platform_admin';
}

export function productAccess(me: Me | null | undefined, productId: string | undefined) {
  if (!me || !productId) return undefined;
  return me.products.find((entry) => entry.product.id === productId);
}

/**
 * Permission check mirroring the server's model (`GET /v1/me`): platform roles grant
 * `platform_permissions` everywhere, product roles grant product and tenant permissions in
 * every tenant of the product, tenant roles grant tenant permissions in that tenant only.
 * The server stays authoritative; this only decides what the UI offers.
 */
export function canAccess(
  me: Me | null | undefined,
  permission: string,
  access?: ProductAccess,
  tenantId?: string,
): boolean {
  if (!me) return false;
  if (hasPermission(me.platform_permissions, permission)) return true;
  if (hasPermission(access?.permissions, permission)) return true;
  if (access && tenantId) {
    const tenant = access.tenants.find((entry) => entry.tenant.id === tenantId);
    if (hasPermission(tenant?.permissions, permission)) return true;
  }
  return false;
}

/** True if any tenant role of the product grants the permission (e.g. tenant-only members). */
export function canInAnyTenant(access: ProductAccess | undefined, permission: string): boolean {
  return Boolean(access?.tenants.some((entry) => hasPermission(entry.permissions, permission)));
}

// ---- Role ceiling (security adaptation, Axentra 7511a37) ----

/** The owner role of each membership scope; assigning, changing or removing it needs owner rank. */
export const OWNER_ROLE = { product: 'product_owner', tenant: 'tenant_owner' } as const;

export type CeilingScope = keyof typeof OWNER_ROLE;

/** Why the caller may not assign (or change a member with) a role; `null` when it may. */
export type CeilingBlock =
  { reason: 'permissions'; missing: string[] } | { reason: 'owner' } | null;

/**
 * Mirrors the server's role ceiling (SECURITY_MODEL.md, rule 8): a role can be assigned, and a
 * member holding it changed or removed, only if every permission of the role is in the caller's
 * own grant in that scope; the scope's owner role additionally needs owner rank (owner of the
 * scope, a product operator for tenants, or a platform admin). Platform admins are exempt.
 * Unknown roles (free-text input) are not checked here; the server answers `403`.
 */
export function roleCeilingBlock(
  me: Me | null | undefined,
  access: ProductAccess | undefined,
  scope: CeilingScope,
  tenantId: string | undefined,
  role: { key: string; permissions: readonly string[] } | undefined,
): CeilingBlock {
  if (!me || !role) return null;
  if (isPlatformAdmin(me)) return null;
  const missing = role.permissions.filter(
    (permission) => !canAccess(me, permission, access, scope === 'tenant' ? tenantId : undefined),
  );
  if (missing.length > 0) return { reason: 'permissions', missing };
  if (role.key === OWNER_ROLE[scope] && !hasOwnerRank(me, access, scope, tenantId)) {
    return { reason: 'owner' };
  }
  return null;
}

/** Owner rank for the scope's owner role (see `roleCeilingBlock`). */
export function hasOwnerRank(
  me: Me | null | undefined,
  access: ProductAccess | undefined,
  scope: CeilingScope,
  tenantId: string | undefined,
): boolean {
  if (!me) return false;
  if (isPlatformAdmin(me)) return true;
  if (scope === 'product') return access?.role === OWNER_ROLE.product;
  if (access?.role) return true; // any product operator
  const tenant = access?.tenants.find((entry) => entry.tenant.id === tenantId);
  return tenant?.role === OWNER_ROLE.tenant;
}
