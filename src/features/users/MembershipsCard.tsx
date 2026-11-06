import { useQuery } from '@tanstack/react-query';
import { Building2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { usersApi } from '@/api/endpoints';
import type { UserMemberships } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import {
  Card,
  DataTable,
  EmptyState,
  StatusPill,
  Time,
  layout,
  type Column,
} from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';

type ProductRow = UserMemberships['products'][number];
type TenantRow = UserMemberships['tenants'][number];

/**
 * The user's product roles (operator) and tenant memberships, as far as the caller may read
 * them (`GET /v1/users/{id}/memberships`). Read-only: roles are changed on each product's or
 * tenant's Members tab, which the rows link to.
 */
export function MembershipsCard({ userId }: { userId: string }) {
  const { t } = useTranslation('users');
  const query = useQuery({
    queryKey: queryKeys.userMemberships(userId),
    queryFn: () => usersApi.memberships(userId),
  });

  const productColumns: Column<ProductRow>[] = [
    {
      id: 'product',
      header: t('memberships.product'),
      rowHeader: true,
      cell: (row) => (
        <Link className={layout.link} to={`/products/${encodeURIComponent(row.product_id)}`}>
          {row.product_name}
        </Link>
      ),
    },
    { id: 'role', header: t('memberships.role'), cell: (row) => row.role },
    {
      id: 'since',
      header: t('memberships.since'),
      hideOnMobile: true,
      cell: (row) => <Time value={row.created_at} />,
    },
  ];
  const tenantColumns: Column<TenantRow>[] = [
    {
      id: 'tenant',
      header: t('memberships.tenant'),
      rowHeader: true,
      cell: (row) => (
        <Link
          className={layout.link}
          to={`/p/${encodeURIComponent(row.product_id)}/tenants/${encodeURIComponent(row.tenant_id)}`}
        >
          {row.tenant_name}
        </Link>
      ),
    },
    { id: 'product', header: t('memberships.product'), cell: (row) => row.product_name },
    { id: 'role', header: t('memberships.role'), cell: (row) => row.role },
    {
      id: 'status',
      header: t('memberships.tenantStatus'),
      hideOnMobile: true,
      cell: (row) => <StatusPill status={row.tenant_status} />,
    },
  ];

  return (
    <Card
      title={t('memberships.title')}
      description={
        <>
          {t('memberships.description')}{' '}
          <HelpLink topic="users#memberships">{t('common:help.learnMore')}</HelpLink>
        </>
      }
      flush
    >
      <DataTable
        caption={t('memberships.productsCaption')}
        columns={productColumns}
        getRowId={(row) => row.product_id}
        rows={query.data?.products}
        status={query.status}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Building2 />}
            title={t('memberships.noProducts')}
          />
        }
      />
      <DataTable
        caption={t('memberships.tenantsCaption')}
        columns={tenantColumns}
        getRowId={(row) => row.tenant_id}
        rows={query.data?.tenants}
        status={query.status}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Users />}
            title={t('memberships.noTenants')}
          />
        }
      />
    </Card>
  );
}
