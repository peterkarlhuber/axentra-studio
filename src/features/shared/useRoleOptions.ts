import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { accessApi, asItems } from '@/api/endpoints';
import type { Role } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useMe } from '@/app/auth';
import { productAccess, roleCeilingBlock, type CeilingBlock } from '@/app/permissions';

/** Role names for member/invitation forms, from `GET /v1/products/{pid}/roles`. */
export function useRoleOptions(productId: string, scope?: 'product' | 'tenant') {
  const query = useQuery({
    queryKey: queryKeys.roles(productId),
    queryFn: () => accessApi.roles(productId),
    staleTime: 5 * 60_000,
  });
  const roles = asItems(query.data).filter((role) => !scope || !role.scope || role.scope === scope);
  return { roles, isLoading: query.isLoading, isError: query.isError };
}

/**
 * Role options plus the role ceiling (see `roleCeilingBlock`): `blockFor(key)` tells whether the
 * signed-in caller may assign that role, or change/remove a member who holds it. Without the
 * role catalog (no `roles:read`) nothing is blocked here and the server's `403` is shown instead.
 */
export function useRoleCeiling(productId: string, scope: 'product' | 'tenant', tenantId?: string) {
  const { data: me } = useMe();
  const { roles, isError } = useRoleOptions(productId, scope);
  const access = productAccess(me, productId);
  const blockFor = useCallback(
    (key: string): CeilingBlock =>
      roleCeilingBlock(
        me,
        access,
        scope,
        tenantId,
        roles.find((role) => role.key === key),
      ),
    [me, access, scope, tenantId, roles],
  );
  return { roles, rolesUnavailable: isError, blockFor };
}

/** True if at least one listed role is above the caller's level (to show the explanation). */
export function someRoleBlocked(roles: Role[], blockFor: (key: string) => CeilingBlock): boolean {
  return roles.some((role) => blockFor(role.key) !== null);
}
