import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { Badge, Card, DetailList, ErrorState, Skeleton, layout } from '@/components/ui';
import styles from './monitoring.module.css';

const KNOWN_OBSERVABILITY = [
  'log_level',
  'otel_enabled',
  'audit_retention_days',
  'job_retention_days',
] as const;
const KNOWN_NOTIFY = ['provider', 'sender'] as const;

function plain(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Maintenance, retention and tracing as reported by `GET /v1/settings`. Values the API does not
 * report are named as such instead of being guessed.
 */
export function OperationsPanel() {
  const { t } = useTranslation('monitoring');
  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
    retry: false,
  });

  if (settings.isPending) {
    return (
      <Card title={t('ops.title')}>
        <div className={layout.form} aria-busy="true">
          <Skeleton />
          <Skeleton width="60%" />
        </div>
      </Card>
    );
  }
  if (settings.isError) {
    return (
      <Card title={t('ops.title')}>
        {isApiError(settings.error) && settings.error.isForbidden ? (
          <p className={layout.muted}>{t('ops.forbidden')}</p>
        ) : (
          <ErrorState
            error={settings.error}
            onRetry={() => void settings.refetch()}
            compact
            headingLevel={3}
          />
        )}
      </Card>
    );
  }

  const observability = settings.data.observability ?? {};
  const notify = settings.data.notify ?? {};
  const days = (value: unknown) =>
    typeof value === 'number' ? t('ops.days', { count: value }) : t('ops.notReported');
  const otel = observability.otel_enabled;
  const extraObservability = Object.entries(observability).filter(
    ([key]) => !(KNOWN_OBSERVABILITY as readonly string[]).includes(key),
  );
  const extraNotify = Object.entries(notify).filter(
    ([key]) => !(KNOWN_NOTIFY as readonly string[]).includes(key) && key.includes('retention'),
  );

  return (
    <>
      <Card title={t('ops.retentionTitle')} description={t('ops.retentionHelp')}>
        <DetailList
          items={[
            { label: t('ops.auditRetention'), value: days(observability.audit_retention_days) },
            { label: t('ops.jobRetention'), value: days(observability.job_retention_days) },
            {
              label: t('ops.notifyContentRetention'),
              value: days(notify.content_retention_days),
            },
            {
              label: t('ops.notifyMessageRetention'),
              value: days(notify.message_retention_days),
            },
            ...extraNotify.map(([key, value]) => ({ label: key, value: plain(value), mono: true })),
          ]}
        />
        <p className={styles.note}>
          {t('ops.purgeHint')} <code>axentra maintenance purge</code>
        </p>
      </Card>
      <Card title={t('ops.tracingTitle')} description={t('ops.tracingHelp')}>
        <DetailList
          items={[
            {
              label: t('ops.otel'),
              value:
                typeof otel === 'boolean' ? (
                  <Badge tone={otel ? 'success' : 'neutral'}>
                    {otel ? t('ops.enabled') : t('ops.disabled')}
                  </Badge>
                ) : (
                  t('ops.notReported')
                ),
            },
            {
              label: t('ops.logLevel'),
              value: plain(observability.log_level) || t('ops.notReported'),
              mono: true,
            },
            {
              label: t('ops.notifyProvider'),
              value: plain(notify.provider) || t('ops.notReported'),
              mono: true,
            },
            { label: t('ops.environment'), value: settings.data.environment, mono: true },
            ...extraObservability.map(([key, value]) => ({
              label: key,
              value: plain(value),
              mono: true,
            })),
          ]}
        />
      </Card>
    </>
  );
}
