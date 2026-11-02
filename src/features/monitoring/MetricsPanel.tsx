import { useQuery } from '@tanstack/react-query';
import { BarChart3, KeyRound } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { observabilityApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Skeleton,
  layout,
} from '@/components/ui';
import { useFormatters } from '@/lib/format';
import {
  METRIC_GROUPS,
  groupOf,
  histogramRows,
  labelNames,
  parsePrometheus,
  total,
  valueRows,
  type MetricFamily,
} from './prometheus';
import styles from './monitoring.module.css';

/**
 * `GET /metrics` of the API process, parsed and shown as tables. Values are cumulative since
 * the process started and belong to this one process (each API worker has its own).
 */
export function MetricsPanel() {
  const { t } = useTranslation('monitoring');
  const [tokenDraft, setTokenDraft] = useState('');
  // The token only lives in this component's state; it is never stored.
  const [token, setToken] = useState('');
  const [attempt, setAttempt] = useState(0);
  const tokenId = useId();
  const metrics = useQuery({
    queryKey: queryKeys.metrics(attempt),
    queryFn: () => observabilityApi.metrics(token || undefined),
    retry: false,
    refetchInterval: (query) => (query.state.status === 'error' ? false : 30_000),
  });

  const needsToken = isApiError(metrics.error) && metrics.error.isUnauthenticated;
  const disabled = isApiError(metrics.error) && metrics.error.isNotFound;

  const applyToken = (event: FormEvent) => {
    event.preventDefault();
    setToken(tokenDraft.trim());
    setAttempt((value) => value + 1);
  };

  return (
    <Card
      title={t('metrics.title')}
      description={t('metrics.description')}
      aria-label={t('metrics.title')}
    >
      <div className={layout.form}>
        {metrics.isPending ? (
          <div className={layout.form} aria-busy="true">
            <Skeleton height={60} />
            <Skeleton height={120} />
          </div>
        ) : disabled ? (
          <EmptyState
            compact
            headingLevel={3}
            icon={<BarChart3 />}
            title={t('metrics.disabledTitle')}
            description={t('metrics.disabledBody')}
          />
        ) : needsToken ? (
          <Alert tone="warning" title={t('metrics.tokenRequiredTitle')}>
            {token ? t('metrics.tokenRejected') : t('metrics.tokenRequiredBody')}
          </Alert>
        ) : metrics.isError ? (
          <ErrorState
            error={metrics.error}
            onRetry={() => void metrics.refetch()}
            compact
            headingLevel={3}
          />
        ) : (
          <MetricsView text={metrics.data} />
        )}
        {needsToken || token ? (
          <form className={styles.tokenForm} onSubmit={applyToken} aria-labelledby={tokenId}>
            <h3 id={tokenId} className={styles.subTitle}>
              {t('metrics.tokenTitle')}
            </h3>
            <FormField label={t('metrics.token')} help={t('metrics.tokenHelp')}>
              <Input
                type="password"
                value={tokenDraft}
                onChange={(event) => setTokenDraft(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </FormField>
            <div>
              <Button type="submit" icon={<KeyRound />} disabled={!tokenDraft.trim()}>
                {t('metrics.useToken')}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </Card>
  );
}

function MetricsView({ text }: { text: string }) {
  const { t } = useTranslation('monitoring');
  const format = useFormatters();
  const families = parsePrometheus(text);
  const byName = new Map(families.map((family) => [family.name, family]));
  const http = byName.get('axentra_http_requests_total');
  const duration = byName.get('axentra_http_request_duration_seconds');
  const durationRows = duration ? histogramRows(duration) : [];
  const durationCount = durationRows.reduce((sum, row) => sum + row.count, 0);
  const durationSum = durationRows.reduce((sum, row) => sum + row.sum, 0);
  const deliveries = byName.get('axentra_notify_deliveries_total');

  const number = (value: number | undefined) =>
    value === undefined ? t('metrics.notExposed') : format.number(value);
  const tiles: { id: string; label: string; value: string }[] = [
    { id: 'requests', label: t('metrics.kpi.requests'), value: number(total(http)) },
    {
      id: 'errors5xx',
      label: t('metrics.kpi.errors5xx'),
      value: number(total(http, (labels) => (labels.status ?? '').startsWith('5'))),
    },
    {
      id: 'errors4xx',
      label: t('metrics.kpi.errors4xx'),
      value: number(total(http, (labels) => (labels.status ?? '').startsWith('4'))),
    },
    {
      id: 'latency',
      label: t('metrics.kpi.latency'),
      value:
        durationCount > 0
          ? t('metrics.ms', {
              value: format.number(Math.round((durationSum / durationCount) * 10000) / 10),
            })
          : t('metrics.notExposed'),
    },
    {
      id: 'authFailures',
      label: t('metrics.kpi.authFailures'),
      value: number(total(byName.get('axentra_auth_failures_total'))),
    },
    {
      id: 'notifyEnqueued',
      label: t('metrics.kpi.notifyEnqueued'),
      value: number(total(byName.get('axentra_notify_messages_enqueued_total'))),
    },
    {
      id: 'notifySent',
      label: t('metrics.kpi.notifySent'),
      value: number(total(deliveries, (labels) => labels.outcome === 'sent')),
    },
    {
      id: 'notifyFailed',
      label: t('metrics.kpi.notifyFailed'),
      value: number(total(deliveries, (labels) => labels.outcome === 'failed')),
    },
  ];

  if (families.length === 0) {
    return <EmptyState compact headingLevel={3} title={t('metrics.empty')} />;
  }

  return (
    <>
      <ul className={styles.kpis} aria-label={t('metrics.kpiLabel')}>
        {tiles.map((tile) => (
          <li key={tile.id} className={styles.kpi}>
            <span className={styles.kpiValue}>{tile.value}</span>
            <span className={styles.kpiLabel}>{tile.label}</span>
          </li>
        ))}
      </ul>
      <p className={layout.muted}>{t('metrics.perProcess')}</p>
      {METRIC_GROUPS.map((group) => {
        const members = families.filter((family) => groupOf(family.name) === group);
        if (members.length === 0) return null;
        return (
          <section key={group} className={styles.group} aria-labelledby={`metrics-${group}`}>
            <h3 id={`metrics-${group}`} className={styles.subTitle}>
              {t(`metrics.groups.${group}`)}
            </h3>
            {members.map((family) => (
              <FamilyTable key={family.name} family={family} />
            ))}
          </section>
        );
      })}
    </>
  );
}

const MAX_ROWS = 50;

function FamilyTable({ family }: { family: MetricFamily }) {
  const { t } = useTranslation('monitoring');
  const format = useFormatters();
  const isHistogram = family.type === 'histogram' || family.type === 'summary';
  const rows = isHistogram ? histogramRows(family) : valueRows(family);
  const labels = labelNames(rows);
  const shown = rows.slice(0, MAX_ROWS);
  const caption = family.help || family.name;
  const value = (number: number) =>
    Number.isInteger(number)
      ? format.number(number)
      : format.number(Math.round(number * 1000) / 1000);

  return (
    <div className={styles.family}>
      <div className={styles.familyHead}>
        <code className={styles.familyName}>{family.name}</code>
        <Badge>{t(`metrics.types.${family.type}`)}</Badge>
      </div>
      {family.help ? <p className={layout.muted}>{family.help}</p> : null}
      {rows.length === 0 ? (
        <p className={layout.muted}>{t('metrics.noSamples')}</p>
      ) : (
        <div className={styles.scroll} role="region" aria-label={caption} tabIndex={0}>
          <table className={styles.table}>
            <caption className="ax-sr-only">{caption}</caption>
            <thead>
              <tr>
                {labels.map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
                {isHistogram ? (
                  <>
                    <th scope="col" className={styles.num}>
                      {t('metrics.count')}
                    </th>
                    <th scope="col" className={styles.num}>
                      {t('metrics.average')}
                    </th>
                  </>
                ) : (
                  <th scope="col" className={styles.num}>
                    {t('metrics.value')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, index) => (
                <tr key={index}>
                  {labels.map((label) => (
                    <td key={label} className={styles.labelCell}>
                      {row.labels[label] ?? '—'}
                    </td>
                  ))}
                  {'count' in row ? (
                    <>
                      <td className={styles.num}>{format.number(row.count)}</td>
                      <td className={styles.num}>
                        {row.count > 0
                          ? family.name.endsWith('_seconds')
                            ? t('metrics.ms', {
                                value: format.number(
                                  Math.round((row.sum / row.count) * 10000) / 10,
                                ),
                              })
                            : value(row.sum / row.count)
                          : '—'}
                      </td>
                    </>
                  ) : (
                    <td className={styles.num}>{value(row.value)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > MAX_ROWS ? (
        <p className={layout.muted}>
          {t('metrics.truncated', { shown: MAX_ROWS, total: rows.length })}
        </p>
      ) : null}
    </div>
  );
}
