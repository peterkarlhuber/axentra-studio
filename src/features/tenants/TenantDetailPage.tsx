import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CircleCheck, Database, Lock, Save, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { tenantsApi } from '@/api/endpoints';
import type { Tenant } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useMeta, useProductScope } from '@/app/contexts';
import { useCrumbLabel } from '@/app/crumbs';
import { isModuleEnabled } from '@/app/modules';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  DetailList,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  PageHeader,
  Skeleton,
  StatusPill,
  Tabs,
  Time,
  layout,
  useToast,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { MembersPanel } from '@/features/shared/MembersPanel';
import { HelpLink } from '@/help/HelpLink';
import { InvitationsPanel } from './InvitationsPanel';
import { ReactivateTenantDialog } from './ReactivateTenantDialog';
import { useSetTenantStatus, useSuspendedDataAccess } from './tenantStatus';

export function TenantDetailPage() {
  const { t } = useTranslation('tenants');
  const { tenantId = '' } = useParams();
  const { productId } = useProductScope();
  const meta = useMeta();
  const can = useCan();
  const navigate = useNavigate();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const suspendedDataAccess = useSuspendedDataAccess();
  const query = useQuery({
    queryKey: queryKeys.tenant(productId, tenantId),
    queryFn: () => tenantsApi.get(productId, tenantId),
  });
  useCrumbLabel(query.data?.name);

  const setStatus = useSetTenantStatus(productId);

  if (query.isPending) {
    return (
      <div className={layout.stack} aria-busy="true">
        <Skeleton width={260} height={36} />
        <Skeleton height={200} radius={12} />
      </div>
    );
  }
  if (query.isError)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} headingLevel={1} />;
  const tenant = query.data;
  const scope = { tenantId: tenant.id };
  const suspended = tenant.status === 'suspended';
  const canUpdate = can('tenants:update');
  // A suspended tenant's data is closed to everyone but platform roles (the server answers 403);
  // its record stays readable for product operators so they can reactivate it.
  const canData = (permission: string) =>
    suspended ? suspendedDataAccess(permission) : can(permission, scope);
  const dataClosed = suspended && !suspendedDataAccess('members:read');
  const closedPanel = (
    <Card>
      <EmptyState
        compact
        headingLevel={3}
        icon={<Lock />}
        title={t('suspendedData.title')}
        description={canUpdate ? t('suspendedData.bodyCanReactivate') : t('suspendedData.body')}
        action={
          canUpdate ? (
            <Button icon={<CircleCheck />} onClick={() => setReactivating(true)}>
              {t('detail.activate')}
            </Button>
          ) : null
        }
      />
    </Card>
  );

  return (
    <div className={layout.stack}>
      <PageHeader
        title={tenant.name}
        help="tenants"
        meta={
          <>
            <StatusPill status={tenant.status} />
            <code className={layout.mono}>{tenant.id}</code>
          </>
        }
        actions={
          <>
            {isModuleEnabled(meta.modules, 'records') && canData('records:read') ? (
              <ButtonLink
                to={`/p/${productId}/records?tenant=${encodeURIComponent(tenant.id)}`}
                icon={<Database />}
              >
                {t('detail.records')}
              </ButtonLink>
            ) : null}
            {canUpdate ? (
              suspended ? (
                <Button
                  variant="primary"
                  icon={<CircleCheck />}
                  loading={setStatus.isPending}
                  onClick={() => setReactivating(true)}
                >
                  {t('detail.activate')}
                </Button>
              ) : (
                <Button icon={<Ban />} onClick={() => setSuspending(true)}>
                  {t('detail.suspend')}
                </Button>
              )
            ) : null}
            {can('tenants:delete') ? (
              <Button variant="dangerOutline" icon={<Trash2 />} onClick={() => setDeleting(true)}>
                {t('detail.delete')}
              </Button>
            ) : null}
          </>
        }
      />
      {suspended ? (
        <Alert tone="warning" title={t('suspendedBanner.title')}>
          {dataClosed ? t('suspendedBanner.body') : t('suspendedBanner.bodyPlatform')}{' '}
          {canUpdate ? t('suspendedBanner.canReactivate') : t('suspendedBanner.askOperator')}{' '}
          <HelpLink topic="tenants#reactivate">{t('common:help.learnMore')}</HelpLink>
        </Alert>
      ) : null}
      <Tabs
        label={t('detail.tabs')}
        items={[
          {
            value: 'details',
            label: t('detail.details'),
            content: (
              <TenantDetails
                key={`${tenant.id}:${tenant.version}`}
                tenant={tenant}
                productId={productId}
                canEdit={canUpdate}
              />
            ),
          },
          {
            value: 'members',
            label: t('detail.members'),
            hidden: !can('members:read', scope),
            content: dataClosed ? (
              closedPanel
            ) : (
              <Card flush>
                <MembersPanel
                  productId={productId}
                  scope="tenant"
                  tenantId={tenant.id}
                  caption={t('detail.members')}
                  queryKey={queryKeys.tenantMembers(productId, tenant.id)}
                  list={() => tenantsApi.members(productId, tenant.id)}
                  add={(body) => tenantsApi.addMember(productId, tenant.id, body)}
                  updateRole={(userId, role) =>
                    tenantsApi.updateMember(productId, tenant.id, userId, role)
                  }
                  remove={(userId) => tenantsApi.removeMember(productId, tenant.id, userId)}
                  invite={async (body) => {
                    const created = await tenantsApi.invite(productId, tenant.id, body);
                    void queryClient.invalidateQueries({
                      queryKey: queryKeys.invitations(productId, tenant.id),
                    });
                    return created;
                  }}
                  canManage={canData('members:manage')}
                />
              </Card>
            ),
          },
          {
            value: 'invitations',
            label: t('detail.invitations'),
            hidden: !can('members:read', scope),
            content: dataClosed ? (
              closedPanel
            ) : (
              <Card flush>
                <InvitationsPanel
                  productId={productId}
                  tenantId={tenant.id}
                  canManage={canData('members:manage')}
                />
              </Card>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={suspending}
        onOpenChange={setSuspending}
        title={t('detail.suspendTitle')}
        description={t('detail.suspendBody', { name: tenant.name })}
        confirmLabel={t('detail.suspend')}
        onConfirm={() => setStatus.mutateAsync({ tenant, status: 'suspended' })}
      >
        <HelpLink topic="tenants#suspend">{t('common:help.learnMore')}</HelpLink>
      </ConfirmDialog>
      <ReactivateTenantDialog
        tenant={tenant}
        open={reactivating}
        onOpenChange={setReactivating}
        onConfirm={() => setStatus.mutateAsync({ tenant, status: 'active' })}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t('detail.deleteTitle')}
        description={t('detail.deleteBody', { name: tenant.name })}
        confirmLabel={t('detail.delete')}
        confirmText={tenant.slug}
        onConfirm={async () => {
          try {
            await tenantsApi.remove(productId, tenant.id);
            toast.success(t('detail.deleted', { name: tenant.name }));
            queryClient.removeQueries({ queryKey: queryKeys.tenant(productId, tenant.id) });
            void queryClient.invalidateQueries({ queryKey: ['products', productId, 'tenants'] });
            void navigate(`/p/${productId}/tenants`, { replace: true });
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      >
        <HelpLink topic="tenants#delete">{t('common:help.learnMore')}</HelpLink>
      </ConfirmDialog>
    </div>
  );
}

function TenantDetails({
  tenant,
  productId,
  canEdit,
}: {
  tenant: Tenant;
  productId: string;
  canEdit: boolean;
}) {
  const { t } = useTranslation('tenants');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(tenant.name);

  const save = useMutation({
    mutationFn: () =>
      tenantsApi.update(productId, tenant.id, { name: name.trim() }, tenant.version),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenant(productId, tenant.id), updated);
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'tenants', 'list'] });
      toast.success(t('detail.saved'));
    },
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  const fields = save.error ? fieldErrors(save.error) : {};

  return (
    <div className={layout.grid2}>
      <Card title={t('detail.overview')}>
        <DetailList
          items={[
            { label: t('fields.id'), value: tenant.id, mono: true },
            { label: t('fields.slug'), value: tenant.slug, mono: true },
            { label: t('fields.status'), value: <StatusPill status={tenant.status} /> },
            {
              label: t('fields.created'),
              value: <Time value={tenant.created_at} mode="absolute" />,
            },
            {
              label: t('fields.updated'),
              value: <Time value={tenant.updated_at} mode="absolute" />,
            },
          ]}
        />
      </Card>
      {canEdit ? (
        <Card title={t('detail.edit')}>
          <form className={layout.form} onSubmit={submit}>
            <FormField label={t('fields.name')} error={fields.name} required>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </FormField>
            <div className={layout.actions}>
              <Button
                type="submit"
                variant="primary"
                icon={<Save />}
                loading={save.isPending}
                disabled={!name.trim() || name.trim() === tenant.name}
              >
                {t('common:actions.save')}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
