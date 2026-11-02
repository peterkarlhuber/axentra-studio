import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Webhook } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { webhooksApi } from '@/api/endpoints';
import type { NewWebhookSecret, WebhookEndpoint } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Button,
  Card,
  DataTable,
  Dialog,
  EmptyState,
  PageHeader,
  StatusPill,
  Time,
  layout,
  type Column,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { useCursorList } from '@/lib/useCursorList';
import { SecretRevealDialog } from '@/features/access/SecretRevealDialog';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { HelpLink } from '@/help/HelpLink';
import { webhookFormInvalid, type WebhookFormValues } from './events-utils';
import { TypeList, WebhookFields } from './WebhookFields';
import { FormError } from './shared';
import styles from './events.module.css';

export function WebhooksPage() {
  const { t } = useTranslation('events');
  const { productId } = useProductScope();
  const can = useCan();
  const canManage = can('webhooks:manage');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const creating = params.get('new') === '1' && canManage;
  const [created, setCreated] = useState<NewWebhookSecret | null>(null);
  const { tableProps } = useCursorList(queryKeys.webhooks(productId), (cursor) =>
    webhooksApi.list(productId, { cursor }),
  );

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

  const columns: Column<WebhookEndpoint>[] = [
    {
      id: 'url',
      header: t('webhooks.url'),
      rowHeader: true,
      cell: (endpoint) => (
        <span className={layout.cellStack}>
          <Link className={`${layout.link} ${styles.url}`} to={endpoint.id}>
            {endpoint.url}
          </Link>
          {endpoint.description ? (
            <span className={layout.muted}>{endpoint.description}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: 'state',
      header: t('webhooks.state'),
      cell: (endpoint) => <StatusPill status={endpoint.enabled ? 'active' : 'disabled'} />,
    },
    {
      id: 'types',
      header: t('webhooks.eventTypes'),
      hideOnMobile: true,
      cell: (endpoint) => <TypeList types={endpoint.event_types} />,
    },
    {
      id: 'tenant',
      header: t('webhooks.tenantFilter'),
      hideOnMobile: true,
      cell: (endpoint) =>
        endpoint.tenant_id ? (
          <code className={layout.mono}>{endpoint.tenant_id}</code>
        ) : (
          <span className={layout.muted}>{t('webhooks.allTenants')}</span>
        ),
    },
    {
      id: 'created',
      header: t('jobs.created'),
      hideOnMobile: true,
      cell: (endpoint) => <Time value={endpoint.created_at} />,
    },
  ];

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('webhooks.title')}
        description={t('webhooks.description')}
        help="webhooks"
        actions={
          canManage ? (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              {t('webhooks.create')}
            </Button>
          ) : null
        }
      />
      <Card flush>
        <DataTable
          caption={t('webhooks.title')}
          columns={columns}
          getRowId={(endpoint) => endpoint.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<Webhook />}
              title={t('webhooks.empty')}
              description={canManage ? t('webhooks.emptyBody') : undefined}
              action={
                <HelpLink topic="tutorial-webhook-receiver">{t('webhooks.emptyTutorial')}</HelpLink>
              }
            />
          }
          {...tableProps}
        />
      </Card>
      {creating ? (
        <CreateWebhookDialog
          productId={productId}
          onClose={() => setCreating(false)}
          onCreated={(result) => {
            setCreating(false);
            setCreated(result);
            void queryClient.invalidateQueries({ queryKey: queryKeys.webhooks(productId) });
          }}
        />
      ) : null}
      <SecretRevealDialog
        secret={created?.secret ?? null}
        keyName={created?.endpoint.url ?? ''}
        title={t('webhooks.secretTitle')}
        secretLabel={t('webhooks.secret')}
        onClose={() => {
          const id = created?.endpoint.id;
          setCreated(null);
          if (id) void navigate(id);
        }}
      >
        <p className={layout.muted}>{t('webhooks.secretUsage')}</p>
        <p>
          <HelpLink topic="tutorial-webhook-receiver#verify-signature">
            {t('webhooks.secretHowTo')}
          </HelpLink>
        </p>
      </SecretRevealDialog>
    </div>
  );
}

function CreateWebhookDialog({
  productId,
  onClose,
  onCreated,
}: {
  productId: string;
  onClose: () => void;
  onCreated: (result: NewWebhookSecret) => void;
}) {
  const { t } = useTranslation('events');
  const [values, setValues] = useState<WebhookFormValues>({
    url: '',
    description: '',
    eventTypes: [],
    enabled: true,
  });
  const [tenantId, setTenantId] = useState('');
  const create = useMutation({
    mutationFn: () =>
      webhooksApi.create(productId, {
        url: values.url.trim(),
        description: values.description.trim(),
        event_types: values.eventTypes,
        enabled: values.enabled,
        ...(tenantId ? { tenant_id: tenantId } : {}),
      }),
    onSuccess: onCreated,
  });
  const fields = create.error ? fieldErrors(create.error) : {};
  const invalid = webhookFormInvalid(values);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!invalid) create.mutate();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={t('webhooks.create')}
      description={t('webhooks.createDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="webhook-form"
            variant="primary"
            loading={create.isPending}
            disabled={invalid}
          >
            {t('webhooks.createSubmit')}
          </Button>
        </>
      }
    >
      <form id="webhook-form" className={layout.form} onSubmit={submit} noValidate>
        <FormError error={create.error} />
        <WebhookFields productId={productId} values={values} onChange={setValues} fields={fields} />
        <TenantPicker
          productId={productId}
          value={tenantId}
          onChange={setTenantId}
          label={t('webhooks.tenantFilter')}
          help={t('webhooks.tenantFilterHelp')}
          allowNone
          noneLabel={t('webhooks.allTenants')}
        />
      </form>
    </Dialog>
  );
}
