import type { Permission } from '@/api/models';

export interface PermissionGroup {
  /** The part before `:` (`tenants`, or `crm.deals` for a product permission). */
  resource: string;
  /** `product` when the group holds permissions the product declared itself. */
  source: 'builtin' | 'product';
  items: Permission[];
}

export const isProductPermission = (permission: Pick<Permission, 'source'>) =>
  permission.source === 'product';

/**
 * Group permissions by resource (`tenants:read` -> `tenants`, `crm.deals:approve` ->
 * `crm.deals`). Built-in groups come first, then the product's own, each sorted by name.
 */
export function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const groups = new Map<string, PermissionGroup>();
  for (const permission of permissions) {
    const [resource = permission.name] = permission.name.split(':');
    const source = isProductPermission(permission) ? 'product' : 'builtin';
    const id = `${source}:${resource}`;
    const group = groups.get(id) ?? { resource, source, items: [] };
    group.items.push(permission);
    groups.set(id, group);
  }
  return [...groups.values()]
    .sort(
      (a, b) =>
        Number(a.source === 'product') - Number(b.source === 'product') ||
        a.resource.localeCompare(b.resource),
    )
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

/** Permissions a role of `scope` may hold: tenant roles tenant-scoped ones, never platform ones. */
export function grantableFor(permissions: Permission[], scope: 'product' | 'tenant') {
  return permissions.filter(
    (permission) =>
      !permission.retired_at &&
      (permission.scope === 'tenant' || (permission.scope === 'product' && scope === 'product')),
  );
}
