import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { metaApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { Button, Card, PageHeader, StatusPill, layout } from '@/components/ui';
import { HealthSummary } from '@/features/system/HealthSummary';
import { MetricsPanel } from './MetricsPanel';
import { OperationsPanel } from './OperationsPanel';

/**
 * Monitoring: readiness checks (a 503 still lists each check), liveness, the Prometheus
 * metrics of the API process and the maintenance/retention/tracing settings the API reports.
 */
export function MonitoringPage() {
  const { t } = useTranslation('monitoring');
  const queryClient = useQueryClient();
  const live = useQuery({
    queryKey: ['health', 'live'],
    queryFn: metaApi.live,
    retry: false,
    refetchInterval: 30_000,
  });
  const liveStatus = live.isPending ? undefined : live.isError ? 'down' : live.data.status;

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button
            icon={<RefreshCw />}
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.health });
              void queryClient.invalidateQueries({ queryKey: ['observability'] });
              void live.refetch();
            }}
          >
            {t('common:actions.refresh')}
          </Button>
        }
      />
      <div className={layout.grid2}>
        <Card
          title={t('health.readiness')}
          description={t('health.readinessHelp')}
          aria-label={t('health.readiness')}
          accent
        >
          <HealthSummary />
        </Card>
        <div className={layout.stack}>
          <Card title={t('health.liveness')} description={t('health.livenessHelp')}>
            {liveStatus ? (
              <StatusPill status={liveStatus} />
            ) : (
              <span className={layout.muted}>{t('common:states.loading')}</span>
            )}
          </Card>
          <OperationsPanel />
        </div>
      </div>
      <MetricsPanel />
    </div>
  );
}
