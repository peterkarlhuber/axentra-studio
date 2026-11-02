import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { metaApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { ErrorState, Skeleton, StatusPill, layout } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { useFormatters } from '@/lib/format';
import { healthChecks } from './health-utils';
import styles from './system.module.css';

/** Readiness from `GET /v1/health/ready` (a 503 is rendered as "unavailable" with checks). */
export function HealthSummary({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation('system');
  const format = useFormatters();
  const query = useQuery({
    queryKey: queryKeys.health,
    queryFn: metaApi.ready,
    refetchInterval: 30_000,
    retry: false,
  });

  if (query.isPending) {
    return (
      <div className={layout.form} aria-busy="true">
        <Skeleton width={120} height={22} />
        <Skeleton />
        <Skeleton width="70%" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        onRetry={() => void query.refetch()}
        compact
        headingLevel={3}
      />
    );
  }

  const checks = healthChecks(query.data);
  return (
    <div className={layout.form}>
      <div className={styles.healthHead}>
        <StatusPill status={query.data.status} />
        <span className={layout.muted}>
          {t('health.updated', {
            time: format.dateTime(new Date(query.dataUpdatedAt).toISOString()),
          })}
        </span>
      </div>
      {query.data.status !== 'ok' ? (
        <p className={layout.muted}>
          {t('health.notReady')}{' '}
          <HelpLink topic="health-monitoring#troubleshooting">{t('health.notReadyLink')}</HelpLink>
        </p>
      ) : null}
      {checks.length > 0 ? (
        <ul className={styles.checks}>
          {(compact ? checks.slice(0, 8) : checks).map((check) => (
            <li key={check.name} className={styles.check}>
              <span className={styles.checkName}>{check.name}</span>
              <StatusPill status={check.ok ? 'ok' : 'fail'} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={layout.muted}>{t('health.noChecks')}</p>
      )}
    </div>
  );
}
