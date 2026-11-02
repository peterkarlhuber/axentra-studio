import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tenantsApi } from '@/api/endpoints';
import type { Tenant } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast, useMe } from '@/app/auth';
import { hasPermission } from '@/app/permissions';
import { useToast } from '@/components/ui';

/**
 * Suspends or reactivates a tenant (`PATCH …/tenants/{id}` with the tenant's version as
 * `If-Match`). On success the detail cache gets the new tenant and every tenant query of the
 * product (lists, members, invitations) is refetched. On failure the error toast says what went
 * wrong; the tenant is refetched too, so a retry after a conflict uses the current version.
 */
export function useSetTenantStatus(productId: string) {
  const { t } = useTranslation('tenants');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['products', productId, 'tenants'] });
  return useMutation({
    mutationFn: ({ tenant, status }: { tenant: Tenant; status: 'active' | 'suspended' }) =>
      tenantsApi.update(productId, tenant.id, { status }, tenant.version),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenant(productId, updated.id), updated);
      void refresh();
      toast.success(updated.status === 'suspended' ? t('detail.suspended') : t('detail.activated'));
    },
    onError: (error) => {
      showError(error);
      void refresh();
    },
  });
}

/**
 * While a tenant is suspended the server refuses its data (members, invitations, records, files,
 * usage, billing) to everyone except platform roles; the tenant record itself stays readable for
 * product operators. True if the signed-in user may still read `permission` in a suspended tenant.
 */
export function useSuspendedDataAccess() {
  const { data: me } = useMe();
  return (permission: string) => hasPermission(me?.platform_permissions, permission);
}
