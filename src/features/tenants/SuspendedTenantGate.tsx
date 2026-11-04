import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { tenantsApi } from '@/api/endpoints';
import type { Tenant } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useMe } from '@/app/auth';
import { ButtonLink, Card, EmptyState, Skeleton } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { useSuspendedDataAccess } from './tenantStatus';

interface Props {
  productId: string;
  tenantId: string;
  /** The permission the wrapped screen reads the tenant's data with, e.g. `billing:read`. */
  permission: string;
  children: ReactNode;
  /** Heading level of the explanation, to keep the page outline valid. */
  headingLevel?: 2 | 3;
  /** Render the explanation without its own card (inside an existing card). */
  bare?: boolean;
}

/** A tenant from any cached tenant list of the product (the tenant pickers load one). */
function cachedTenant(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
  tenantId: string,
): Tenant | undefined {
  const lists = queryClient.getQueriesData<{ items?: Tenant[] }>({
    queryKey: ['products', productId, 'tenants', 'list'],
  });
  for (const [, data] of lists) {
    const found = data?.items?.find((tenant) => tenant.id === tenantId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Wraps a screen that loads one tenant's data (subscription, invitations, records, files,
 * search, usage). While the tenant is suspended the server refuses that data with `403` to
 * everyone but platform roles, although the tenant record itself stays readable for product
 * operators. Instead of the generic "Not permitted" state, this explains the suspension, links
 * to the tenant page (where it can be reactivated) and does not mount the wrapped screen, so no
 * request is sent that is known to fail.
 *
 * Callers whose platform role still reads the data, and tenants whose record cannot be read,
 * get the wrapped screen unchanged (it shows the server's answer).
 */
export function SuspendedTenantGate({
  productId,
  tenantId,
  permission,
  children,
  headingLevel = 2,
  bare,
}: Props) {
  const { t } = useTranslation('tenants');
  const can = useCan();
  const queryClient = useQueryClient();
  const me = useMe();
  const platformReads = useSuspendedDataAccess()(permission);
  const tenant = useQuery({
    queryKey: queryKeys.tenant(productId, tenantId),
    queryFn: () => tenantsApi.get(productId, tenantId),
    // Only callers without a platform role need the status (known once `/v1/me` is loaded).
    enabled: Boolean(tenantId) && me.isSuccess && !platformReads,
    // The status from a tenant list avoids waiting for the tenant record in the common case.
    placeholderData: () => cachedTenant(queryClient, productId, tenantId),
  });

  if (platformReads || !tenantId || tenant.isError || me.isError) return <>{children}</>;
  if (!tenant.data) {
    return (
      <div aria-busy="true">
        <Skeleton height={160} radius={12} />
      </div>
    );
  }
  if (tenant.data.status !== 'suspended') return <>{children}</>;

  const canReactivate = can('tenants:update');
  const tenantPath = `/p/${encodeURIComponent(productId)}/tenants/${encodeURIComponent(tenantId)}`;
  const state = (
    <EmptyState
      headingLevel={headingLevel}
      tone="warning"
      icon={<Lock />}
      title={t('suspendedData.title')}
      description={
        <p>
          {t('suspendedPage.body', { name: tenant.data.name })}{' '}
          {canReactivate ? t('suspendedPage.canReactivate') : t('suspendedBanner.askOperator')}{' '}
          <HelpLink topic="tenants#reactivate">{t('common:help.learnMore')}</HelpLink>
        </p>
      }
      action={
        <ButtonLink to={tenantPath} icon={<Building2 />}>
          {t('suspendedPage.openTenant')}
        </ButtonLink>
      }
    />
  );
  return <div role="status">{bare ? state : <Card>{state}</Card>}</div>;
}
