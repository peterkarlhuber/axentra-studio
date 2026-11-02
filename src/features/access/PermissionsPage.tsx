import { useQuery } from '@tanstack/react-query';
import { Lock, ShieldPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { accessApi, asItems } from '@/api/endpoints';
import type { Permission } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useProductScope } from '@/app/contexts';
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Switch,
  Time,
  layout,
  type Column,
} from '@/components/ui';
import { isProductPermission } from './permission-groups';
import { InfoTip } from '@/help/InfoTip';

/**
 * Read-only catalog of everything that can be granted in the product: the permissions the product
 * declared itself (`GET /v1/products/{id}/permissions`, `source: product`) and Axentra's built-in
 * product and tenant permissions. Products declare permissions in code or over the API; Studio
 * only shows them.
 */
export function PermissionsPage() {
  const { t } = useTranslation('access');
  const { productId } = useProductScope();
  const [showRetired, setShowRetired] = useState(false);
  const query = useQuery({
    queryKey: queryKeys.productPermissions(productId, showRetired),
    queryFn: () => accessApi.productPermissions(productId, showRetired),
  });
  const all = asItems(query.data);
  const own = all.filter(isProductPermission);
  const builtIn = all.filter((permission) => !isProductPermission(permission));

  const scopeBadge = (permission: Permission) => (
    <Badge tone={permission.scope === 'product' ? 'brand' : 'info'}>
      {t(`permissions.scopes.${permission.scope}`)}
    </Badge>
  );
  const nameCell = (permission: Permission) => (
    <span className={layout.cellStack}>
      <code>{permission.name}</code>
      {permission.description ? (
        <span className={layout.muted}>{permission.description}</span>
      ) : null}
    </span>
  );

  const ownColumns: Column<Permission>[] = [
    { id: 'name', header: t('catalog.name'), rowHeader: true, cell: nameCell },
    { id: 'scope', header: t('catalog.scope'), hideOnMobile: true, cell: scopeBadge },
    {
      id: 'grants',
      header: (
        <>
          {t('catalog.defaultRoles')}{' '}
          <InfoTip
            label={t('catalog.defaultRolesAbout')}
            topic="roles-permissions#product-permissions"
          >
            {t('catalog.defaultRolesInfo')}
          </InfoTip>
        </>
      ),
      hideOnMobile: true,
      cell: (permission) => (
        <span className={layout.tags}>
          {permission.read_like ? <Badge tone="info">{t('catalog.readLike')}</Badge> : null}
          {(permission.default_roles ?? []).map((role) => (
            <Badge key={role}>{role}</Badge>
          ))}
          {!permission.read_like && !(permission.default_roles ?? []).length ? (
            <span className={layout.muted}>{t('catalog.ownersOnly')}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: 'declared',
      header: (
        <>
          {t('catalog.declaredBy')}{' '}
          <InfoTip
            label={t('catalog.declaredByAbout')}
            topic="roles-permissions#product-permissions"
          >
            {t('catalog.declaredByInfo')}
          </InfoTip>
        </>
      ),
      hideOnMobile: true,
      cell: (permission) =>
        permission.declared_by ? t(`catalog.declared.${permission.declared_by}`) : null,
    },
    {
      id: 'status',
      header: t('catalog.status'),
      cell: (permission) =>
        permission.retired_at ? (
          <span className={layout.cellStack}>
            <Badge tone="warning">{t('catalog.retired')}</Badge>
            <Time value={permission.retired_at} />
          </span>
        ) : (
          <Badge tone="success">{t('catalog.active')}</Badge>
        ),
    },
  ];

  const builtInColumns: Column<Permission>[] = [
    { id: 'name', header: t('catalog.name'), rowHeader: true, cell: nameCell },
    { id: 'scope', header: t('catalog.scope'), cell: scopeBadge },
  ];

  const tableState = {
    status: query.status,
    error: query.error,
    onRetry: () => void query.refetch(),
  };

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('catalog.title')}
        description={t('catalog.description')}
        help="roles-permissions#product-permissions"
      />
      <Card
        flush
        title={t('catalog.own')}
        description={t('catalog.ownDescription')}
        actions={
          <Switch
            checked={showRetired}
            onCheckedChange={setShowRetired}
            label={t('catalog.showRetired')}
          />
        }
      >
        <DataTable
          caption={t('catalog.own')}
          columns={ownColumns}
          rows={own}
          getRowId={(permission) => permission.name}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<ShieldPlus />}
              title={t('catalog.ownEmpty')}
              description={t('catalog.ownEmptyBody')}
            />
          }
          {...tableState}
        />
      </Card>
      <Card
        flush
        title={
          <span className={layout.tags}>
            <Lock aria-hidden width={16} height={16} /> {t('catalog.builtIn')}
          </span>
        }
        description={t('catalog.builtInDescription')}
      >
        <DataTable
          caption={t('catalog.builtIn')}
          columns={builtInColumns}
          rows={builtIn}
          getRowId={(permission) => permission.name}
          {...tableState}
        />
      </Card>
    </div>
  );
}
