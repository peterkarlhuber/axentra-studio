import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { metaApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { STUDIO_VERSION } from '@/api/client';
import { REQUIRED_API, formatApiVersion } from '@/api/compat';
import { useMeta } from '@/app/contexts';
import { Button, Card, DetailList, PageHeader, StatusPill, layout } from '@/components/ui';
import { HealthSummary } from './HealthSummary';

export function HealthPage() {
  const { t } = useTranslation('system');
  const meta = useMeta();
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
        title={t('health.title')}
        description={t('health.description')}
        actions={
          <Button
            icon={<RefreshCw />}
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.health });
              void live.refetch();
            }}
          >
            {t('common:actions.refresh')}
          </Button>
        }
      />
      <div className={layout.grid2}>
        <Card title={t('health.readiness')} description={t('health.readinessHelp')} accent>
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
          <Card title={t('health.versions')}>
            <DetailList
              items={[
                {
                  label: t('bootstrap.serverVersion'),
                  value: `${meta.name} ${meta.version}`,
                  mono: true,
                },
                {
                  label: t('bootstrap.serverApi'),
                  value: formatApiVersion(meta.api_version),
                  mono: true,
                },
                { label: t('environment'), value: meta.environment, mono: true },
                { label: t('bootstrap.studioVersion'), value: STUDIO_VERSION, mono: true },
                {
                  label: t('bootstrap.requiredApi'),
                  value: formatApiVersion(REQUIRED_API),
                  mono: true,
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
