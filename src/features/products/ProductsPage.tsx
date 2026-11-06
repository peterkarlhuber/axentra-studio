import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Boxes, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { productsApi } from '@/api/endpoints';
import type { Product } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useVisibleProducts } from '@/app/useProducts';
import { useMeta } from '@/app/contexts';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusPill,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { ProductFormDialog } from './ProductFormDialog';

export function ProductsPage() {
  const { t } = useTranslation('products');
  const meta = useMeta();
  const can = useCan();
  const navigate = useNavigate();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const products = useVisibleProducts();
  const rows = products.data
    ? [...products.data].sort((a, b) => a.name.localeCompare(b.name))
    : undefined;

  // Creating products needs the platform permission and multi-product mode.
  const canCreate = meta.mode === 'multi' && can('products:create');
  // The create dialog follows the address (`?new=1`), like the other create dialogs (UX.md), so
  // it can be linked and survives a reload.
  const creating = canCreate && params.get('new') === '1';
  const setCreating = (open: boolean) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (open) next.set('new', '1');
        else next.delete('new');
        return next;
      },
      { replace: true },
    );

  const create = useMutation({
    mutationFn: productsApi.create,
    onSuccess: (product) => {
      toast.success(t('create.success', { name: product.name }));
      setCreating(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      void navigate(`/products/${encodeURIComponent(product.id)}`);
    },
    onError: showError,
  });

  const columns: Column<Product>[] = [
    {
      id: 'name',
      header: t('fields.name'),
      rowHeader: true,
      cell: (product) => (
        <span className={layout.cellStack}>
          <Link className={layout.link} to={`/products/${encodeURIComponent(product.id)}`}>
            {product.name}
          </Link>
          {product.description ? <span className={layout.muted}>{product.description}</span> : null}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('fields.status'),
      cell: (product) => <StatusPill status={product.status} />,
    },
    {
      id: 'slug',
      header: t('fields.slug'),
      hideOnMobile: true,
      cell: (product) => <code className={layout.mono}>{product.slug}</code>,
    },
    {
      id: 'created',
      header: t('fields.created'),
      hideOnMobile: true,
      cell: (product) => <Time value={product.created_at} />,
    },
    {
      id: 'open',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (product) =>
        product.status === 'archived' ? null : (
          <ButtonLink
            size="sm"
            variant="ghost"
            to={`/p/${encodeURIComponent(product.id)}/dashboard`}
            iconRight={<ArrowRight />}
            aria-label={t('openDashboardFor', { name: product.name })}
          >
            {t('openDashboard')}
          </ButtonLink>
        ),
    },
  ];

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('title')}
        description={meta.mode === 'single' ? t('descriptionSingle') : t('description')}
        help="products"
        actions={
          canCreate ? (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              {t('create.open')}
            </Button>
          ) : null
        }
      />
      {meta.mode === 'single' ? (
        <Alert tone="info" title={t('singleMode.title')}>
          {t('singleMode.body')}{' '}
          <HelpLink topic="products#single-product-mode">{t('common:help.learnMore')}</HelpLink>
        </Alert>
      ) : null}
      <Card flush>
        <DataTable
          caption={t('title')}
          columns={columns}
          getRowId={(product) => product.id}
          rows={rows}
          status={products.status}
          error={products.error}
          onRetry={() => void products.refetch()}
          empty={
            <EmptyState
              compact
              headingLevel={2}
              icon={<Boxes />}
              // Without products:create the list is empty because nothing was shared yet, not
              // because the installation is empty.
              title={canCreate ? t('empty.title') : t('empty.titleNoAccess')}
              description={canCreate ? t('empty.bodyAdmin') : t('empty.body')}
              action={
                canCreate ? (
                  <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
                    {t('create.open')}
                  </Button>
                ) : null
              }
            />
          }
        />
      </Card>
      {canCreate ? (
        <ProductFormDialog
          open={creating}
          onOpenChange={setCreating}
          submitting={create.isPending}
          error={create.error}
          onSubmit={(values) =>
            create.mutate({ name: values.name, slug: values.slug, description: values.description })
          }
        />
      ) : null}
    </div>
  );
}
