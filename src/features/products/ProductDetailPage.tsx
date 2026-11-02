import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, ArrowRight, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { productsApi } from '@/api/endpoints';
import type { Product } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useMeta } from '@/app/contexts';
import { useCrumbLabel } from '@/app/crumbs';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  DetailList,
  ErrorState,
  FormField,
  Input,
  PageHeader,
  Skeleton,
  StatusPill,
  Tabs,
  Textarea,
  Time,
  layout,
  useToast,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { MembersPanel } from '@/features/shared/MembersPanel';
import { StoragePolicyCard } from '@/features/storage/StoragePolicyCard';
import { isModuleEnabled } from '@/app/modules';

export function ProductDetailPage() {
  const { t } = useTranslation('products');
  const { productId = '' } = useParams();
  const meta = useMeta();
  const can = useCan();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<'archive' | 'restore' | null>(null);
  const query = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productsApi.get(productId),
  });
  useCrumbLabel(query.data?.name);

  const lifecycle = useMutation({
    mutationFn: (action: 'archive' | 'restore') =>
      action === 'archive' ? productsApi.archive(productId) : productsApi.restore(productId),
    onSuccess: (_, action) => {
      toast.success(t(`lifecycle.${action}Success`));
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: showError,
  });

  if (query.isPending) {
    return (
      <div className={layout.stack} aria-busy="true">
        <Skeleton width={280} height={36} />
        <Skeleton height={240} radius={12} />
      </div>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const product = query.data;
  const archived = product.status === 'archived';
  const canLifecycle = meta.mode === 'multi' && can('products:archive');

  return (
    <div className={layout.stack}>
      <PageHeader
        title={product.name}
        description={product.description || undefined}
        meta={
          <>
            <StatusPill status={product.status} />
            <code className={layout.mono}>{product.id}</code>
          </>
        }
        actions={
          <>
            {canLifecycle ? (
              <Button
                variant={archived ? 'secondary' : 'danger'}
                icon={archived ? <ArchiveRestore /> : <Archive />}
                onClick={() => setConfirming(archived ? 'restore' : 'archive')}
              >
                {archived ? t('lifecycle.restore') : t('lifecycle.archive')}
              </Button>
            ) : null}
            {!archived ? (
              <ButtonLink
                variant="primary"
                to={`/p/${encodeURIComponent(product.id)}/dashboard`}
                iconRight={<ArrowRight />}
              >
                {t('openDashboard')}
              </ButtonLink>
            ) : null}
          </>
        }
      />
      {archived ? <Alert tone="warning">{t('lifecycle.archivedNotice')}</Alert> : null}
      {meta.mode === 'single' && can('products:archive') ? (
        <Alert tone="info">{t('lifecycle.singleMode')}</Alert>
      ) : null}
      <Tabs
        label={t('tabs.label')}
        items={[
          {
            value: 'details',
            label: t('tabs.details'),
            content: (
              <Card>
                <DetailList
                  columns={2}
                  items={[
                    { label: t('fields.name'), value: product.name },
                    { label: t('fields.id'), value: product.id, mono: true },
                    { label: t('fields.slug'), value: product.slug, mono: true },
                    { label: t('fields.status'), value: <StatusPill status={product.status} /> },
                    {
                      label: t('fields.created'),
                      value: <Time value={product.created_at} mode="absolute" />,
                    },
                    {
                      label: t('fields.updated'),
                      value: <Time value={product.updated_at} mode="absolute" />,
                    },
                    { label: t('fields.description'), value: product.description },
                  ]}
                />
              </Card>
            ),
          },
          {
            value: 'settings',
            label: t('tabs.settings'),
            content: (
              <ProductSettingsForm
                key={`${product.id}:${product.version}`}
                product={product}
                canEdit={!archived && can('product:manage', { productId: product.id })}
              />
            ),
          },
          {
            value: 'files',
            label: t('tabs.files'),
            hidden: !isModuleEnabled(meta.modules, 'files'),
            content: (
              <StoragePolicyCard
                productId={product.id}
                canEdit={!archived && can('product:manage', { productId: product.id })}
              />
            ),
          },
          {
            value: 'members',
            label: t('tabs.members'),
            hidden: !can('product_members:read', { productId: product.id }),
            content: (
              <Card flush>
                <MembersPanel
                  productId={product.id}
                  scope="product"
                  caption={t('tabs.members')}
                  queryKey={queryKeys.productMembers(product.id)}
                  list={() => productsApi.members(product.id)}
                  add={(body) => productsApi.addMember(product.id, body)}
                  updateRole={(userId, role) => productsApi.updateMember(product.id, userId, role)}
                  remove={(userId) => productsApi.removeMember(product.id, userId)}
                  canManage={can('product_members:manage', { productId: product.id })}
                />
              </Card>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => (open ? undefined : setConfirming(null))}
        title={confirming === 'restore' ? t('lifecycle.restoreTitle') : t('lifecycle.archiveTitle')}
        description={
          confirming === 'restore'
            ? t('lifecycle.restoreBody', { name: product.name })
            : t('lifecycle.archiveBody', { name: product.name })
        }
        confirmLabel={confirming === 'restore' ? t('lifecycle.restore') : t('lifecycle.archive')}
        tone={confirming === 'restore' ? 'primary' : 'danger'}
        confirmText={confirming === 'archive' ? product.name : undefined}
        onConfirm={() => lifecycle.mutateAsync(confirming ?? 'archive')}
      />
    </div>
  );
}

function ProductSettingsForm({ product, canEdit }: { product: Product; canEdit: boolean }) {
  const { t } = useTranslation('products');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? '');
  const [settings, setSettings] = useState(JSON.stringify(product.settings ?? {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (body: { name: string; description: string; settings: Record<string, unknown> }) =>
      productsApi.update(product.id, body, product.version),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.product(product.id), updated);
      void queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      toast.success(t('settings.saved'));
    },
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    let parsed: unknown;
    try {
      parsed = JSON.parse(settings || '{}');
    } catch {
      setJsonError(t('settings.invalidJson'));
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setJsonError(t('settings.mustBeObject'));
      return;
    }
    setJsonError(null);
    save.mutate({
      name: name.trim(),
      description: description.trim(),
      settings: parsed as Record<string, unknown>,
    });
  };

  const fields = save.error ? fieldErrors(save.error) : {};

  return (
    <Card
      title={t('settings.title')}
      description={canEdit ? t('settings.description') : t('settings.readOnly')}
    >
      <form className={layout.form} onSubmit={submit}>
        <FormField label={t('fields.name')} error={fields.name} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canEdit}
          />
        </FormField>
        <FormField label={t('fields.description')} error={fields.description}>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!canEdit}
          />
        </FormField>
        <FormField
          label={t('fields.settings')}
          help={t('settings.jsonHelp')}
          error={jsonError ?? fields.settings}
        >
          <Textarea
            mono
            rows={10}
            value={settings}
            onChange={(event) => setSettings(event.target.value)}
            disabled={!canEdit}
            spellCheck={false}
          />
        </FormField>
        {canEdit ? (
          <div className={layout.actions}>
            <Button type="submit" variant="primary" icon={<Save />} loading={save.isPending}>
              {t('common:actions.save')}
            </Button>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
