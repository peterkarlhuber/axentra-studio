import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';

const LIMIT = 200;

/**
 * Tenant id -> name for the first 200 tenants (same list the tenant picker uses), so tables
 * can show names. Unknown ids fall back to the id itself.
 */
export function useTenantNames(productId: string, enabled = true) {
  const params = { limit: LIMIT };
  const query = useQuery({
    queryKey: queryKeys.tenants(productId, params),
    queryFn: () => tenantsApi.list(productId, params),
    enabled,
  });
  const names = new Map((query.data?.items ?? []).map((tenant) => [tenant.id, tenant.name]));
  return (tenantId: string) => names.get(tenantId);
}
