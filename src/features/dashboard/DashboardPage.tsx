import { useQuery } from '@tanstack/react-query';
import { Activity, Hash, KeyRound, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { productsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useMeta, useProductScope } from '@/app/contexts';
import { BACKEND_MODULES, isModuleEnabled } from '@/app/modules';
import { formatApiVersion } from '@/api/compat';
import {
  Badge,
  ButtonLink,
  Card,
  DetailList,
  ErrorState,
  PageHeader,
  Skeleton,
  layout,
} from '@/components/ui';
import { useFormatters } from '@/lib/format';
import { HealthSummary } from '@/features/system/HealthSummary';
import { KNOWN_STATS, overviewStats } from './overview';
import styles from './dashboard.module.css';

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const meta = useMeta();
  const { productId, product } = useProductScope();
  const can = useCan();
  const format = useFormatters();
  const overview = useQuery({
    queryKey: queryKeys.productOverview(productId),
    queryFn: () => productsApi.overview(productId),
  });
  const stats = overviewStats(overview.data as Record<string, unknown> | undefined);

  return (
    <div className={layout.stack}>
      <PageHeader
        title={product?.name ?? t('title')}
        documentTitle={t('title')}
        description={product?.description || t('description')}
        actions={
          <>
            {isModuleEnabled(meta.modules, 'tenants') && can('tenants:create') ? (
              <ButtonLink to={`/p/${productId}/tenants?new=1`} icon={<Plus />}>
                {t('actions.newTenant')}
              </ButtonLink>
            ) : null}
            {isModuleEnabled(meta.modules, 'access') && can('api_keys:manage') ? (
              <ButtonLink
                to={`/p/${productId}/api-keys?new=1`}
                variant="primary"
                icon={<KeyRound />}
              >
                {t('actions.newApiKey')}
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="ax-sr-only">
          {t('overview')}
        </h2>
        {overview.isError ? (
          <Card>
            <ErrorState
              error={overview.error}
              onRetry={() => void overview.refetch()}
              compact
              headingLevel={3}
            />
          </Card>
        ) : (
          <ul className={styles.stats} aria-busy={overview.isPending || undefined}>
            {overview.isPending
              ? Array.from({ length: 4 }, (_, index) => (
                  <li key={index} className={styles.stat}>
                    <Skeleton width={36} height={36} radius={10} />
                    <Skeleton width="50%" height={28} />
                    <Skeleton width="70%" />
                  </li>
                ))
              : stats.map(({ key, value }) => {
                  const known = KNOWN_STATS[key];
                  const Icon = known?.icon ?? Hash;
                  const label = known ? t(known.labelKey) : key;
                  const content = (
                    <>
                      <span className={styles.statIcon} aria-hidden="true">
                        <Icon />
                      </span>
                      <span className={styles.statValue}>{format.number(value)}</span>
                      <span className={styles.statLabel}>{label}</span>
                    </>
                  );
                  return (
                    <li key={key} className={styles.stat}>
                      {known?.to ? (
                        <Link to={known.to(productId)} className={styles.statLink}>
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
            {overview.isSuccess && stats.length === 0 ? (
              <li className={styles.stat}>
                <span className={layout.muted}>{t('noStats')}</span>
              </li>
            ) : null}
          </ul>
        )}
      </section>

      <div className={layout.grid2}>
        <Card
          title={
            <span className={styles.cardTitle}>
              <Activity aria-hidden /> {t('health.title')}
            </span>
          }
          actions={
            <ButtonLink to="/health" size="sm" variant="ghost">
              {t('health.details')}
            </ButtonLink>
          }
          accent
        >
          <HealthSummary compact />
        </Card>
        <Card title={t('server.title')}>
          <DetailList
            items={[
              { label: t('server.name'), value: `${meta.name} ${meta.version}` },
              { label: t('server.api'), value: formatApiVersion(meta.api_version), mono: true },
              { label: t('server.environment'), value: meta.environment, mono: true },
              { label: t('server.mode'), value: t(`server.modes.${meta.mode}`) },
              { label: t('server.productId'), value: productId, mono: true },
              {
                label: t('server.modules'),
                value: (
                  <span className={layout.tags}>
                    {BACKEND_MODULES.map((module) => {
                      const enabled = meta.modules.includes(module);
                      return (
                        <Badge key={module} tone={enabled ? 'success' : 'neutral'}>
                          {module}
                          <span className="ax-sr-only">
                            {' '}
                            ({enabled ? t('server.enabled') : t('server.disabled')})
                          </span>
                        </Badge>
                      );
                    })}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
