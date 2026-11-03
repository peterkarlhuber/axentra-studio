import type { TFunction } from 'i18next';
import type { Role } from '@/api/models';

/**
 * Keys of Axentra's built-in roles. The server sends their description in English only
 * (`BUILTIN_ROLES` in axentra/access/permissions.py), so Studio translates it by key. The names
 * ("Product owner", "Owner", ...) stay as they are: help, API and audit log use them as proper
 * names in every language. A built-in role Studio does not know keeps the server's text.
 */
export const BUILTIN_ROLE_KEYS = [
  'product_owner',
  'product_admin',
  'product_support',
  'product_viewer',
  'tenant_owner',
  'tenant_admin',
  'member',
  'viewer',
] as const;

const known = new Set<string>(BUILTIN_ROLE_KEYS);

/** The role with its description in the interface language (built-in roles only). */
export function localizeRole<T extends Pick<Role, 'key' | 'builtin' | 'description'>>(
  t: TFunction,
  role: T,
): T {
  if (!role.builtin || !known.has(role.key)) return role;
  return { ...role, description: t(`common:builtinRoles.${role.key}`) };
}
