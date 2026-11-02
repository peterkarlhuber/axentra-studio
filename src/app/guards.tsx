import { useQuery } from '@tanstack/react-query';
import { Construction, PowerOff, RefreshCw, ServerCrash } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useParams } from 'react-router';
import { productsApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { FullPageMessage, SplashScreen } from '@/components/layout/FullPageMessage';
import { Button, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { writePreference } from '@/lib/storage';
import { loginPath, useMe, useSession } from './auth';
import { ProductScopeContext, singleProductId, useMeta } from './contexts';
import { IMPLEMENTED_MODULES, isModuleEnabled, MODULE_IDS, type StudioModule } from './modules';
import { productAccess } from './permissions';
import { switchProductPath } from './shell/shell-utils';
import { useLastProductId } from './useLastProduct';

/** Requires a signed-in session; otherwise sends the user to setup or login. */
export function RequireAuth() {
  const { t } = useTranslation();
  const meta = useMeta();
  const location = useLocation();
  const session = useSession();

  if (meta.setup_required) return <Navigate to="/setup" replace />;
  if (session.isPending) return <SplashScreen label={t('states.loading')} />;
  if (session.isError) {
    return (
      <FullPageMessage
        tone="danger"
        icon={<ServerCrash />}
        title={t('system:bootstrap.sessionErrorTitle')}
        actions={
          <Button
            variant="primary"
            icon={<RefreshCw />}
            loading={session.isFetching}
            onClick={() => void session.refetch()}
          >
            {t('actions.retry')}
          </Button>
        }
      >
        <ErrorState error={session.error} compact />
      </FullPageMessage>
    );
  }
  if (!session.data) {
    return <Navigate to={loginPath(`${location.pathname}${location.search}`)} replace />;
  }
  return <Outlet />;
}

/** `/` -> the current product's dashboard, or the product list. */
export function HomeRedirect() {
  const me = useMe();
  const productId = useLastProductId();
  if (me.isPending) return <Skeleton height={32} width={240} />;
  if (me.isError) return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;
  if (productId) return <Navigate to={`/p/${encodeURIComponent(productId)}/dashboard`} replace />;
  return <Navigate to="/products" replace />;
}

/** Validates `:productId` and provides product + access to product-scoped pages. */
export function ProductScope() {
  const { productId = '' } = useParams();
  const { pathname } = useLocation();
  const single = singleProductId(useMeta());
  const { data: me } = useMe();
  const product = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productsApi.get(productId),
    enabled: Boolean(productId),
  });

  useEffect(() => {
    if (product.isSuccess) writePreference('lastProductId', productId);
  }, [product.isSuccess, productId]);

  if (product.isError) {
    // Single-product mode has one product: an unknown product id (an old bookmark, a link from
    // another installation) leads to the same section of that product instead of an error.
    if (
      single &&
      productId !== single &&
      isApiError(product.error) &&
      product.error.status === 404
    ) {
      return <Navigate to={switchProductPath(pathname, single)} replace />;
    }
    return <ErrorState error={product.error} onRetry={() => void product.refetch()} />;
  }

  return (
    <ProductScopeContext.Provider
      value={{ productId, product: product.data, access: productAccess(me, productId) }}
    >
      <Outlet />
    </ProductScopeContext.Provider>
  );
}

/**
 * Renders the section only when the backend reports its module. Never shows placeholder
 * data: a disabled module gets an explicit "not enabled on this server" state.
 */
export function ModuleGate({ module, titleKey }: { module: StudioModule; titleKey: string }) {
  const meta = useMeta();
  const enabled = isModuleEnabled(meta.modules, module);
  if (enabled && IMPLEMENTED_MODULES.has(module)) return <Outlet />;
  return <ModuleUnavailable module={module} titleKey={titleKey} enabled={enabled} />;
}

export function ModuleUnavailable({
  module,
  titleKey,
  enabled,
}: {
  module: StudioModule;
  titleKey: string;
  enabled: boolean;
}) {
  const { t } = useTranslation('system');
  const title = t(`nav:${titleKey}`);
  // Name the backend module id: that is what an operator enables in the server configuration.
  const backendModule = MODULE_IDS[module];
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={enabled ? <Construction /> : <PowerOff />}
        title={enabled ? t('module.notInStudioTitle') : t('module.disabledTitle')}
        description={
          <>
            <p>
              {enabled
                ? t('module.notInStudioBody', { module: backendModule })
                : t('module.disabledBody', { module: backendModule })}
            </p>
            <p>
              <code>{backendModule}</code>
            </p>
          </>
        }
      />
    </>
  );
}
