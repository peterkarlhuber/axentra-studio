import { useQuery } from '@tanstack/react-query';
import { PlugZap, RefreshCw, ServerCrash } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { checkCompatibility, formatApiVersion } from '@/api/compat';
import { STUDIO_VERSION } from '@/api/client';
import { metaApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { FullPageMessage, SplashScreen } from '@/components/layout/FullPageMessage';
import { Button, DetailList } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { MetaContext } from './contexts';

/**
 * Startup gate: loads `GET /v1/meta`, refuses to run against an incompatible API and then
 * provides the metadata to the whole app.
 */
export function MetaGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation('system');
  const query = useQuery({
    queryKey: queryKeys.meta,
    queryFn: metaApi.get,
    staleTime: Infinity,
    retry: 1,
  });

  if (query.isPending) return <SplashScreen label={t('common:states.connecting')} />;

  if (query.isError) {
    const described = describeError(t, query.error);
    return (
      <FullPageMessage
        tone="danger"
        icon={<ServerCrash />}
        title={t('bootstrap.unreachableTitle')}
        actions={
          <Button
            variant="primary"
            icon={<RefreshCw />}
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('common:actions.retry')}
          </Button>
        }
      >
        <p>{t('bootstrap.unreachableBody')}</p>
        <p>
          {described.title}: {described.message}
          {described.requestId ? ` (${t('errors:requestId')}: ${described.requestId})` : ''}
        </p>
      </FullPageMessage>
    );
  }

  const meta = query.data;
  const compat = checkCompatibility(meta.api_version);
  if (!compat.ok) {
    return (
      <FullPageMessage tone="warning" icon={<PlugZap />} title={t('bootstrap.incompatibleTitle')}>
        <p>{t(`bootstrap.incompatible.${compat.reason}`)}</p>
        <DetailList
          items={[
            {
              label: t('bootstrap.serverApi'),
              value: compat.server ? formatApiVersion(compat.server) : compat.raw,
              mono: true,
            },
            {
              label: t('bootstrap.requiredApi'),
              value: `${formatApiVersion(compat.required)}+ (< ${compat.required.major + 1}.0)`,
              mono: true,
            },
            {
              label: t('bootstrap.serverVersion'),
              value: `${meta.name} ${meta.version}`,
              mono: true,
            },
            { label: t('bootstrap.studioVersion'), value: STUDIO_VERSION, mono: true },
          ]}
        />
        <p>{t('bootstrap.incompatibleHelp')}</p>
      </FullPageMessage>
    );
  }

  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}
