import { useQuery } from '@tanstack/react-query';
import { Archive, Braces, HardDrive, Lock, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { recordsApi, settingsApi, storageApi, tenantsApi } from '@/api/endpoints';
import type { CollectionStats, Page, TenantStorageUsage } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useMeta, useProductScope } from '@/app/contexts';
import { isModuleEnabled } from '@/app/modules';
import {
  Badge,
  Card,
  DataTable,
  DetailList,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  Time,
  layout,
  type Column,
} from '@/components/ui';
import { useFormatters } from '@/lib/format';
import { useCursorList } from '@/lib/useCursorList';
import { HelpLink } from '@/help/HelpLink';
import { InfoTip } from '@/help/InfoTip';
import { formatBytes, numberSetting, storageLimits, usagePercent } from './storage-utils';
import styles from './storage.module.css';

export function DataOverviewPage() {
  const { t } = useTranslation('storage');
  const { productId } = useProductScope();
  const meta = useMeta();
  const can = useCan();
  const canStats = can('collections:read');
  const canSettings = can('platform:settings') || can('product:manage');
  const storageEnabled = isModuleEnabled(meta.modules, 'files');

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('overview.title')}
        description={t('overview.description')}
        help="data-overview"
      />
      {!canStats ? (
        <Card>
          <EmptyState
            headingLevel={2}
            icon={<Lock />}
            title={t('overview.noAccessTitle')}
            description={
              <>
                <p>{t('overview.noAccessBody')}</p>
                <HelpLink topic="data-overview#what-you-see" />
              </>
            }
          />
        </Card>
      ) : (
        <>
          <CollectionsCard productId={productId} />
          {storageEnabled ? (
            <ProductStorageCard productId={productId} />
          ) : (
            <Card title={t('overview.storageTitle')}>
              <EmptyState
                compact
                headingLevel={3}
                icon={<HardDrive />}
                title={t('overview.storageOffTitle')}
                description={
                  <>
                    <p>{t('overview.storageOffBody')}</p>
                    <HelpLink topic="data-overview#troubleshooting" />
                  </>
                }
              />
            </Card>
          )}
        </>
      )}
      {canSettings ? (
        <ConfigurationCards productId={productId} storageEnabled={storageEnabled} />
      ) : null}
    </div>
  );
}

function CollectionsCard({ productId }: { productId: string }) {
  const { t } = useTranslation('storage');
  const format = useFormatters();
  const collections = useQuery({
    queryKey: queryKeys.collections(productId),
    queryFn: () => recordsApi.collections(productId),
  });
  const base = `/p/${encodeURIComponent(productId)}/records`;
  const columns: Column<CollectionStats>[] = [
    {
      id: 'collection',
      header: t('overview.collection'),
      rowHeader: true,
      cell: (item) => (
        <Link
          className={layout.link}
          to={`${base}?collection=${encodeURIComponent(item.collection)}`}
        >
          <code>{item.collection}</code>
        </Link>
      ),
    },
    {
      id: 'records',
      header: t('overview.records'),
      align: 'end',
      cell: (item) => format.number(item.records),
    },
    {
      id: 'tenants',
      header: t('overview.tenants'),
      align: 'end',
      cell: (item) => format.number(item.tenants),
    },
    {
      id: 'updated',
      header: t('overview.lastUpdated'),
      hideOnMobile: true,
      cell: (item) => <Time value={item.last_updated_at} />,
    },
  ];
  const rows = collections.data;
  const totalRecords = rows?.reduce((sum, item) => sum + item.records, 0) ?? 0;

  return (
    <Card flush title={t('overview.collectionsTitle')} description={t('overview.collectionsBody')}>
      {rows && rows.length > 0 ? (
        <dl className={`${styles.stats} ${styles.statsPadded}`}>
          <div className={styles.stat}>
            <dt>{t('overview.collectionCount')}</dt>
            <dd>{format.number(rows.length)}</dd>
          </div>
          <div className={styles.stat}>
            <dt>{t('overview.recordCount')}</dt>
            <dd>{format.number(totalRecords)}</dd>
          </div>
        </dl>
      ) : null}
      <DataTable
        caption={t('overview.collectionsTitle')}
        columns={columns}
        getRowId={(item) => item.collection}
        rows={rows}
        status={collections.status}
        error={collections.error}
        onRetry={() => void collections.refetch()}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Braces />}
            title={t('overview.collectionsEmpty')}
            description={t('overview.collectionsEmptyBody')}
          />
        }
      />
    </Card>
  );
}

type UsagePage = Page<TenantStorageUsage> & {
  summary: {
    bytes_used: number;
    files_used: number;
    default_quota_bytes: number | null;
    default_quota_files: number | null;
  };
};

function ProductStorageCard({ productId }: { productId: string }) {
  const { t } = useTranslation('storage');
  const format = useFormatters();
  const tenantParams = { limit: 200, sort: 'name' };
  const tenants = useQuery({
    queryKey: queryKeys.tenants(productId, tenantParams),
    queryFn: () => tenantsApi.list(productId, tenantParams),
  });
  const names = new Map((tenants.data?.items ?? []).map((tenant) => [tenant.id, tenant.name]));
  const { query, tableProps } = useCursorList<TenantStorageUsage>(
    queryKeys.productStorage(productId),
    async (cursor): Promise<UsagePage> => {
      const page = await storageApi.productUsage(productId, { cursor, limit: 50 });
      return {
        items: page.tenants,
        next_cursor: page.next_cursor,
        summary: {
          bytes_used: page.bytes_used,
          files_used: page.files_used,
          default_quota_bytes: page.default_quota_bytes,
          default_quota_files: page.default_quota_files,
        },
      };
    },
  );
  const summary = (query.data?.pages[0] as UsagePage | undefined)?.summary;
  const bytes = (value: number) => formatBytes(value, format.locale);
  const filesBase = `/p/${encodeURIComponent(productId)}/files`;

  const quotaCell = (
    used: number,
    quota: number | null,
    override: number | null,
    fmt: (v: number) => string,
  ) => {
    if (quota === null) return <span className={layout.muted}>{t('overview.unlimited')}</span>;
    const percent = usagePercent(used, quota) ?? 0;
    return (
      <span className={layout.cellStack}>
        <span>
          {fmt(quota)}{' '}
          {override !== null ? <Badge tone="info">{t('usage.overrideShort')}</Badge> : null}
        </span>
        <span className={layout.muted}>{t('usage.percent', { percent })}</span>
      </span>
    );
  };

  const columns: Column<TenantStorageUsage>[] = [
    {
      id: 'tenant',
      header: t('overview.tenant'),
      rowHeader: true,
      cell: (row) => (
        <Link
          className={layout.link}
          to={`${filesBase}?tenant=${encodeURIComponent(row.tenant_id)}`}
        >
          {names.get(row.tenant_id) ?? <code>{row.tenant_id}</code>}
        </Link>
      ),
    },
    {
      id: 'bytes',
      header: t('usage.bytes'),
      align: 'end',
      cell: (row) => bytes(row.bytes_used),
    },
    {
      id: 'files',
      header: t('usage.files'),
      align: 'end',
      cell: (row) => format.number(row.files_used),
    },
    {
      id: 'quotaBytes',
      header: (
        <>
          {t('overview.quotaBytes')}{' '}
          <InfoTip label={t('overview.quotaInfoLabel')} topic="data-overview#quotas">
            {t('overview.quotaInfo')}
          </InfoTip>
        </>
      ),
      hideOnMobile: true,
      cell: (row) => quotaCell(row.bytes_used, row.quota_bytes, row.quota_bytes_override, bytes),
    },
    {
      id: 'quotaFiles',
      header: (
        <>
          {t('overview.quotaFiles')}{' '}
          <InfoTip label={t('overview.quotaInfoLabel')} topic="data-overview#quotas">
            {t('overview.quotaInfo')}
          </InfoTip>
        </>
      ),
      hideOnMobile: true,
      cell: (row) =>
        quotaCell(row.files_used, row.quota_files, row.quota_files_override, format.number),
    },
  ];

  return (
    <Card flush title={t('overview.storageTitle')} description={t('overview.storageBody')}>
      {query.isPending ? (
        <div className={`${layout.form} ${styles.statsPadded}`} aria-busy="true">
          <Skeleton width="40%" />
        </div>
      ) : summary ? (
        <dl className={`${styles.stats} ${styles.statsPadded}`}>
          <div className={styles.stat}>
            <dt>{t('overview.bytesUsed')}</dt>
            <dd>{bytes(summary.bytes_used)}</dd>
          </div>
          <div className={styles.stat}>
            <dt>{t('overview.filesUsed')}</dt>
            <dd>{format.number(summary.files_used)}</dd>
          </div>
          <div className={styles.stat}>
            <dt>{t('overview.defaultQuotaBytes')}</dt>
            <dd>
              {summary.default_quota_bytes === null
                ? t('overview.unlimited')
                : bytes(summary.default_quota_bytes)}
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>{t('overview.defaultQuotaFiles')}</dt>
            <dd>
              {summary.default_quota_files === null
                ? t('overview.unlimited')
                : format.number(summary.default_quota_files)}
            </dd>
          </div>
        </dl>
      ) : null}
      <DataTable
        caption={t('overview.storageTable')}
        columns={columns}
        getRowId={(row) => row.tenant_id}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<HardDrive />}
            title={t('overview.storageEmpty')}
          />
        }
        {...tableProps}
      />
    </Card>
  );
}

function ConfigurationCards({
  productId,
  storageEnabled,
}: {
  productId: string;
  storageEnabled: boolean;
}) {
  const { t } = useTranslation('storage');
  const format = useFormatters();
  // The product's own content-type policy (product:read); shown instead of the installation flag.
  const policy = useQuery({
    queryKey: queryKeys.storagePolicy(productId),
    queryFn: () => storageApi.policy(productId),
    enabled: storageEnabled,
    retry: false,
  });
  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
    staleTime: 5 * 60_000,
  });
  if (settings.isPending) {
    return (
      <Card title={t('overview.configTitle')}>
        <Skeleton width="60%" />
      </Card>
    );
  }
  if (settings.isError) {
    return (
      <Card title={t('overview.configTitle')}>
        <ErrorState
          error={settings.error}
          onRetry={() => void settings.refetch()}
          compact
          headingLevel={3}
        />
      </Card>
    );
  }
  const limits = storageLimits(settings.data);
  const auditDays = numberSetting(settings.data.observability, 'audit_retention_days');
  const jobDays = numberSetting(settings.data.observability, 'job_retention_days');
  const days = (value: number | undefined) =>
    value === undefined
      ? undefined
      : t('overview.days', { count: value, formatted: format.number(value) });

  return (
    <div className={layout.grid2}>
      {storageEnabled && limits ? (
        <Card
          title={t('overview.configTitle')}
          description={t('overview.configBody')}
          actions={<HelpLink topic="data-overview#storage-configuration" />}
        >
          <DetailList
            items={[
              { label: t('overview.backend'), value: limits.backend, mono: true },
              {
                label: t('overview.maxFile'),
                value:
                  limits.maxFileBytes === undefined
                    ? undefined
                    : formatBytes(limits.maxFileBytes, format.locale),
              },
              {
                label: t('overview.allowedTypes'),
                value:
                  limits.allowedContentTypes.length > 0
                    ? limits.allowedContentTypes.join(', ')
                    : t('upload.allTypes'),
              },
              {
                label: t('overview.blocked'),
                value: policy.data
                  ? t('overview.blockedProduct', {
                      value:
                        policy.data.blocked_types === 'store_inert'
                          ? t('upload.blockedInert')
                          : t('upload.blockedRefused'),
                      source: t(`policy.source.${policy.data.blocked_types_source}`),
                    })
                  : limits.storeBlockedAsInert === undefined
                    ? undefined
                    : limits.storeBlockedAsInert
                      ? t('upload.blockedInert')
                      : t('upload.blockedRefused'),
              },
            ]}
          />
        </Card>
      ) : (
        <Card title={t('overview.configTitle')}>
          <EmptyState
            compact
            headingLevel={3}
            icon={<Settings2 />}
            title={t('overview.storageOffTitle')}
          />
        </Card>
      )}
      <Card
        title={t('overview.retentionTitle')}
        description={t('overview.retentionBody')}
        actions={<HelpLink topic="data-overview#retention" />}
      >
        <DetailList
          items={[
            { label: t('overview.auditRetention'), value: days(auditDays) },
            { label: t('overview.jobRetention'), value: days(jobDays) },
          ]}
        />
        <EmptyState
          compact
          headingLevel={3}
          icon={<Archive />}
          title={t('overview.backupTitle')}
          description={t('overview.backupBody')}
        />
      </Card>
    </div>
  );
}
