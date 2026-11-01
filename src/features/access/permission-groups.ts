import type { Permission } from '@/api/models';

/** Group permissions by resource (`tenants:read` -> `tenants`). */
export function groupPermissions(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const [resource = permission.name] = permission.name.split(':');
    const list = groups.get(resource) ?? [];
    list.push(permission);
    groups.set(resource, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([resource, items]) => ({
      resource,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
