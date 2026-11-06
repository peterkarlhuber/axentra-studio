import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlugZap, RefreshCw, ServerCrash } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { checkCompatibility, formatApiVersion, parseApiVersion } from '@/api/compat';
import { STUDIO_VERSION, onApiVersion } from '@/api/client';
import { metaApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { FullPageMessage, SplashScreen } from '@/components/layout/FullPageMessage';
import { Button, DetailList } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { MetaContext } from './contexts';

/** The help center works without the API, so it stays reachable when the server is not. */
function isHelpPath(): boolean {
  return typeof window !== 'undefined' && /^\/help(\/|$)/.test(window.location.pathname);
}

/** Plain link (this gate sits outside the router): opens the matching troubleshooting section. */
function TroubleshootingLink({ anchor }: { anchor: string }) {
  const { t } = useTranslation('help');
  return (
    <p>
      <a href={`/help/troubleshooting#${anchor}`}>{t('tip.learnMore')}</a>
    </p>
  );
}

/**
 * Startup gate: loads `GET /v1/meta`, refuses to run against an incompatible API and then
 * provides the metadata to the whole app. Help center routes render even when the server is
 * unreachable or incompatible (without metadata), so users can read the troubleshooting guide.
 */
export function MetaGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation('system');
  const query = useQuery({
    queryKey: queryKeys.meta,
    queryFn: metaApi.get,
    staleTime: Infinity,
    retry: 1,
  });
  // A response announcing another API version than the loaded metadata (the server was
  // upgraded while this tab is open) reloads `/v1/meta`: an incompatible server then shows the
  // page below, a compatible one updates modules and settings.
  const queryClient = useQueryClient();
  const loaded = query.data?.api_version;
  useEffect(
    () =>
      onApiVersion((header) => {
        const announced = parseApiVersion(header);
        const current = parseApiVersion(loaded);
        if (!announced || !current) return;
        if (announced.major !== current.major || announced.minor !== current.minor) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.meta });
        }
      }),
    [loaded, queryClient],
  );

  if (query.isPending) return <SplashScreen label={t('common:states.connecting')} />;

  if (isHelpPath() && (query.isError || !checkCompatibility(query.data.api_version).ok)) {
    return <>{children}</>;
  }

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
        <TroubleshootingLink anchor="api-unreachable" />
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
        <TroubleshootingLink anchor="incompatible-version" />
      </FullPageMessage>
    );
  }

  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}
