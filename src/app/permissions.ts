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
