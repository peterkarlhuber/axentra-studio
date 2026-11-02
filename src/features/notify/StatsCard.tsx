import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notifyApi } from '@/api/endpoints';
import type { NotifyStatusCounts } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { Badge, Card, DetailList, ErrorState, Skeleton, Time, layout } from '@/components/ui';
import { useFormatters } from '@/lib/format';
import { MESSAGE_STATUSES } from './notify-utils';
import styles from './notify.module.css';

/** Delivery statistics (`GET /notify/stats`): counts per status, overall and last 24 hours. */
export function StatsCard({ productId }: { productId: string }) {
  const { t } = useTranslation('notify');
  const format = useFormatters();
  const stats = useQuery({
    queryKey: queryKeys.notifyStats(productId),
    queryFn: () => notifyApi.stats(productId),
    refetchInterval: 30_000,
  });

  return (
    <Card title={t('stats.title')} description={t('stats.description')}>
      {stats.isPending ? (
        <div className={layout.form} aria-busy="true">
          <Skeleton />
          <Skeleton width="60%" />
        </div>
      ) : stats.isError ? (
        <ErrorState
          error={stats.error}
          onRetry={() => void stats.refetch()}
          compact
          headingLevel={3}
        />
      ) : (
        <div className={layout.grid2}>
          <div className={styles.scroll} role="region" aria-label={t('stats.table')} tabIndex={0}>
            <table className={styles.statsTable}>
              <caption className="ax-sr-only">{t('stats.table')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('fields.status')}</th>
                  <th scope="col">{t('stats.total')}</th>
                  <th scope="col">{t('stats.last24h')}</th>
                </tr>
              </thead>
              <tbody>
                {MESSAGE_STATUSES.map((status) => (
                  <tr key={status}>
                    <th scope="row">{t(`status.${status}`)}</th>
                    <td>{format.number(stats.data.total[status as keyof NotifyStatusCounts])}</td>
                    <td>
                      {format.number(stats.data.last_24h[status as keyof NotifyStatusCounts])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DetailList
            items={[
              {
                label: t('stats.provider'),
                value: <Badge tone="brand">{stats.data.provider}</Badge>,
              },
              { label: t('stats.attempts24h'), value: format.number(stats.data.attempts_24h) },
              {
                label: t('stats.oldestQueued'),
                value: stats.data.oldest_queued_at ? (
                  <Time value={stats.data.oldest_queued_at} />
                ) : (
                  t('stats.noneQueued')
                ),
              },
            ]}
          />
        </div>
      )}
    </Card>
  );
}
