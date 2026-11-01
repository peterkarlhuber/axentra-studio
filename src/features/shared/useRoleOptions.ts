import { useQuery } from '@tanstack/react-query';
import { accessApi, asItems } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';

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
