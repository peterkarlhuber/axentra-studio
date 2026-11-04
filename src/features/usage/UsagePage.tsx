import { useQuery } from '@tanstack/react-query';
import { BarChart3, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { usageApi } from '@/api/endpoints';
import type { Meter, TenantMeterTotal } from '@/api/models';
import { usageBillingKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useMeta, useProductScope } from '@/app/contexts';
import { isModuleEnabled } from '@/app/modules';
import { canInAnyTenant } from '@/app/permissions';
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  Select,
  Skeleton,
  Tabs,
  layout,
  type Column,
} from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { SuspendedTenantGate } from '@/features/tenants/SuspendedTenantGate';
import { useFormatters } from '@/lib/format';
import { useCursorList } from '@/lib/useCursorList';
import { MetersPanel } from './MetersPanel';
import { TenantUsagePanel } from './TenantUsagePanel';
import { UsageChart } from './UsageChart';
import { formatDay, formatQuantity, lastDays, RANGE_DAYS } from './usage-utils';
import { useTenantNames } from './useTenantNames';
import styles from './usage.module.css';

type TabValue = 'overview' | 'meters' | 'tenant';

export function UsagePage() {
  const { t } = useTranslation('usage');
  const { productId, access } = useProductScope();
  const meta = useMeta();
  const can = useCan();
  const [searchParams, setSearchParams] = useSearchParams();
  const productRead = can('usage:read');
  const tenantRead = productRead || canInAnyTenant(access, 'usage:read');
  const canManage = can('usage:manage');
  const tenantId = searchParams.get('tenant') ?? '';
  const requested = searchParams.get('tab') as TabValue | null;
  const tab: TabValue =
    requested === 'meters' || requested === 'tenant' || requested === 'overview'
      ? requested
      : productRead
        ? 'overview'
        : 'tenant';

  const update = (changes: Record<string, string | null>) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );

  if (!tenantRead) {
    return (
      <div className={layout.stack}>
        <PageHeader title={t('title')} description={t('description')} help="usage" />
        <EmptyState icon={<ShieldOff />} title={t('noAccess')} description={t('noAccessBody')} />
      </div>
    );
  }

  return (
    <div className={layout.stack}>
      <PageHeader title={t('title')} description={t('description')} help="usage" />
      <Tabs
        label={t('tabs.label')}
        value={tab}
        onValueChange={(value) => update({ tab: value })}
        items={[
          {
            value: 'overview',
            label: t('tabs.overview'),
            hidden: !productRead,
            content: <ProductOverview productId={productId} />,
          },
          {
            value: 'meters',
            label: t('tabs.meters'),
            hidden: !productRead,
            content: <MetersPanel productId={productId} canManage={canManage} />,
          },
          {
            value: 'tenant',
            label: t('tabs.tenant'),
            content: (
              <div className={layout.stack}>
                {isModuleEnabled(meta.modules, 'tenants') ? (
                  <Card>
                    <div className={styles.filters}>
                      <TenantPicker
                        productId={productId}
                        value={tenantId}
                        onChange={(value) => update({ tenant: value })}
                      />
                    </div>
                  </Card>
                ) : null}
                {tenantId ? (
                  <SuspendedTenantGate
                    productId={productId}
                    tenantId={tenantId}
                    permission="usage:read"
                  >
                    <TenantUsagePanel key={tenantId} productId={productId} tenantId={tenantId} />
                  </SuspendedTenantGate>
                ) : (
                  <EmptyState
                    compact
                    icon={<BarChart3 />}
                    title={t('tenant.chooseTitle')}
                    description={t('tenant.chooseBody')}
                  />
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

/** Product-wide view: daily chart of one meter (all tenants) and totals per tenant and meter. */
function ProductOverview({ productId }: { productId: string }) {
  const { t } = useTranslation('usage');
  const { locale } = useFormatters();
  const [meterKey, setMeterKey] = useState('');
  const [days, setDays] = useState<number>(30);
  const range = lastDays(days);
  const meters = useQuery({
    queryKey: usageBillingKeys.meters(productId),
    queryFn: () => usageApi.meters(productId),
  });
  const meterList = meters.data ?? [];
  const selected: Meter | undefined =
    meterList.find((meter) => meter.key === meterKey) ??
    meterList.find((meter) => meter.active) ??
    meterList[0];
  const series = useQuery({
    queryKey: usageBillingKeys.productTimeseries(productId, { meter: selected?.key, ...range }),
    queryFn: () => usageApi.productTimeseries(productId, selected?.key ?? '', range),
    enabled: Boolean(selected),
  });
  const tenantName = useTenantNames(productId);
  const summaryParams = { ...range, meter: selected?.key };
  const summary = useCursorList<TenantMeterTotal>(
    usageBillingKeys.productUsageSummary(productId, summaryParams),
    (cursor) => usageApi.productSummary(productId, { ...summaryParams, limit: 50, cursor }),
    { enabled: Boolean(selected) },
  );

  if (meters.isPending) return <Skeleton height={260} radius={12} />;
  if (meters.isError) {
    return <ErrorState error={meters.error} onRetry={() => void meters.refetch()} />;
  }
  if (!selected) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title={t('overview.noMeters')}
        description={
          <>
            {t('overview.noMetersBody')}{' '}
            <HelpLink topic="usage#create-meter">{t('common:help.learnMore')}</HelpLink>
          </>
        }
      />
    );
  }

  const columns: Column<TenantMeterTotal>[] = [
    {
      id: 'tenant',
      header: t('overview.tenant'),
      rowHeader: true,
      cell: (row) => (
        <Link
          className={layout.link}
          to={`?tab=tenant&tenant=${encodeURIComponent(row.tenant_id)}`}
        >
          {tenantName(row.tenant_id) ?? row.tenant_id}
        </Link>
      ),
    },
    {
      id: 'value',
      header: t('overview.value'),
      align: 'end',
      cell: (row) =>
        `${formatQuantity(row.value, locale)}${selected.unit ? ` ${selected.unit}` : ''}`,
    },
    {
      id: 'events',
      header: t('overview.events'),
      align: 'end',
      cell: (row) => formatQuantity(row.event_count, locale),
    },
  ];

  return (
    <div className={layout.stack}>
      <Card>
        <div className={styles.filters}>
          <FormField label={t('overview.meter')}>
            <Select value={selected.key} onChange={(event) => setMeterKey(event.target.value)}>
              {meterList.map((meter) => (
                <option key={meter.id} value={meter.key}>
                  {meter.name ? `${meter.name} (${meter.key})` : meter.key}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('overview.range')}>
            <Select value={String(days)} onChange={(event) => setDays(Number(event.target.value))}>
              {RANGE_DAYS.map((value) => (
                <option key={value} value={value}>
                  {t('overview.lastDays', { count: value })}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Card>
      <Card
        title={t('overview.chartTitle')}
        description={t('overview.chartDescription', {
          from: formatDay(range.since, locale, 'medium'),
          to: formatDay(range.until, locale, 'medium'),
        })}
      >
        {series.isPending ? (
          <Skeleton height={220} radius={8} />
        ) : series.isError ? (
          <ErrorState
            error={series.error}
            onRetry={() => void series.refetch()}
            compact
            headingLevel={3}
          />
        ) : (
          <UsageChart
            points={series.data.points}
            unit={series.data.unit}
            title={t('overview.chartCaption', { meter: selected.name || selected.key })}
          />
        )}
      </Card>
      <Card
        flush
        title={t('overview.totalsTitle')}
        description={t(`overview.totalsBy.${selected.aggregation}`, {
          defaultValue: t('overview.totalsBy.sum'),
        })}
      >
        <DataTable
          caption={t('overview.totalsTitle')}
          columns={columns}
          getRowId={(row) => `${row.tenant_id}:${row.meter}`}
          empty={<EmptyState compact headingLevel={3} title={t('overview.noUsage')} />}
          {...summary.tableProps}
        />
      </Card>
    </div>
  );
}
