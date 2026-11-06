import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, KeyRound, PanelRightOpen, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { webhooksApi } from '@/api/endpoints';
import type {
  NewWebhookSecret,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEndpoint,
  WebhookPatch,
} from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import { useCrumbLabel } from '@/app/crumbs';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DetailList,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  PageHeader,
  Select,
  Skeleton,
  StatusPill,
  Tabs,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { useCursorList } from '@/lib/useCursorList';
import { SecretRevealDialog } from '@/features/access/SecretRevealDialog';
import { HelpLink } from '@/help/HelpLink';
import { InfoTip } from '@/help/InfoTip';
import { DELIVERY_STATUSES, webhookFormInvalid, type WebhookFormValues } from './events-utils';
import { DeliveryStatusPill, FormError } from './shared';
import { TypeList, WebhookFields } from './WebhookFields';
import styles from './events.module.css';

export function WebhookDetailPage() {
  const { t } = useTranslation('events');
  const { webhookId = '' } = useParams();
  const { productId } = useProductScope();
  const can = useCan();
  const canManage = can('webhooks:manage');
  const navigate = useNavigate();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'settings' ? 'settings' : 'deliveries';
  const [rotating, setRotating] = useState(false);
  const [grace, setGrace] = useState('0');
  const [deleting, setDeleting] = useState(false);
  const [secret, setSecret] = useState<NewWebhookSecret | null>(null);
  const [selected, setSelected] = useState<WebhookDelivery | null>(null);
  const key = queryKeys.webhook(productId, webhookId);
  const query = useQuery({ queryKey: key, queryFn: () => webhooksApi.get(productId, webhookId) });
  useCrumbLabel(query.data?.url);

  const invalidateDeliveries = () =>
    queryClient.invalidateQueries({
      queryKey: ['products', productId, 'webhooks', webhookId, 'deliveries'],
    });

  const test = useMutation({
    mutationFn: () => webhooksApi.test(productId, webhookId),
    onSuccess: (delivery) => {
      if (delivery.status === 'succeeded') {
        toast.success(t('webhooks.testOk', { code: delivery.response_code ?? '—' }));
      } else {
        toast.error(
          t('webhooks.testFailed'),
          delivery.response_code
            ? t('webhooks.testFailedCode', { code: delivery.response_code })
            : (delivery.last_error ?? undefined),
        );
      }
      setSelected(delivery);
      void invalidateDeliveries();
    },
    onError: showError,
  });

  if (query.isPending) {
    return (
      <div className={layout.stack} aria-busy="true">
        <Skeleton width={260} height={36} />
        <Skeleton height={240} radius={12} />
      </div>
    );
  }
  if (query.isError)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} headingLevel={1} />;
  const endpoint = query.data;

  return (
    <div className={layout.stack}>
      <PageHeader
        title={<span className={styles.url}>{endpoint.url}</span>}
        documentTitle={endpoint.url}
        help="webhooks"
        description={endpoint.description || undefined}
        meta={
          <>
            <StatusPill status={endpoint.enabled ? 'active' : 'disabled'} />
            <code className={layout.mono}>{endpoint.id}</code>
          </>
        }
        actions={
          canManage ? (
            <>
              <Button icon={<Send />} loading={test.isPending} onClick={() => test.mutate()}>
                {t('webhooks.test')}
              </Button>
              <Button icon={<KeyRound />} onClick={() => setRotating(true)}>
                {t('webhooks.rotate')}
              </Button>
              <Button variant="danger" icon={<Trash2 />} onClick={() => setDeleting(true)}>
                {t('webhooks.delete')}
              </Button>
            </>
          ) : null
        }
      />
      {endpoint.has_previous_secret ? (
        <Alert tone="info" title={t('webhooks.graceTitle')}>
          {endpoint.previous_secret_expires_at ? (
            <>
              {t('webhooks.graceUntil')}{' '}
              <Time value={endpoint.previous_secret_expires_at} mode="absolute" />
            </>
          ) : (
            t('webhooks.graceActive')
          )}
        </Alert>
      ) : null}
      {!endpoint.enabled ? (
        <Alert tone="warning">
          {t('webhooks.disabledNotice')}{' '}
          <HelpLink topic="webhooks#edit">{t('common:help.learnMore')}</HelpLink>
        </Alert>
      ) : null}
      <Tabs
        label={t('webhooks.tabs')}
        value={tab}
        onValueChange={(value) =>
          setParams(
            (current) => {
              const next = new URLSearchParams(current);
              if (value === 'settings') next.set('tab', 'settings');
              else next.delete('tab');
              return next;
            },
            { replace: true },
          )
        }
        items={[
          {
            value: 'deliveries',
            label: t('webhooks.deliveries'),
            content: (
              <Deliveries
                productId={productId}
                webhookId={webhookId}
                selectedId={selected?.id}
                onSelect={setSelected}
              />
            ),
          },
          {
            value: 'settings',
            label: t('webhooks.settings'),
            content: (
              <WebhookSettings
                key={`${endpoint.id}:${endpoint.version}`}
                productId={productId}
                endpoint={endpoint}
                canEdit={canManage}
                onSaved={(updated) => {
                  queryClient.setQueryData(key, updated);
                  void queryClient.invalidateQueries({ queryKey: queryKeys.webhooks(productId) });
                }}
              />
            ),
          },
        ]}
      />
      <DeliveryDetail
        productId={productId}
        webhookId={webhookId}
        delivery={selected}
        canManage={canManage}
        onClose={() => setSelected(null)}
        onRedelivered={(delivery) => {
          setSelected(delivery);
          void invalidateDeliveries();
        }}
      />
      <ConfirmDialog
        open={rotating}
        onOpenChange={(open) => {
          if (!open) {
            setRotating(false);
            setGrace('0');
          }
        }}
        tone="primary"
        title={t('webhooks.rotateTitle')}
        description={t('webhooks.rotateBody', { url: endpoint.url })}
        confirmLabel={t('webhooks.rotate')}
        onConfirm={async () => {
          try {
            const rotated = await webhooksApi.rotateSecret(productId, webhookId, Number(grace));
            queryClient.setQueryData(key, rotated.endpoint);
            setSecret(rotated);
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      >
        <FormField
          label={t('webhooks.grace')}
          help={t('webhooks.graceHelp')}
          info={t('webhooks.graceInfo')}
          infoTopic="webhooks#rotate-secret"
        >
          <Select value={grace} onChange={(event) => setGrace(event.target.value)}>
            <option value="0">{t('webhooks.graceNone')}</option>
            <option value="3600">{t('webhooks.grace1h')}</option>
            <option value="86400">{t('webhooks.grace24h')}</option>
            <option value="604800">{t('webhooks.grace7d')}</option>
          </Select>
        </FormField>
      </ConfirmDialog>
      <SecretRevealDialog
        secret={secret?.secret ?? null}
        keyName={endpoint.url}
        title={t('webhooks.secretTitle')}
        secretLabel={t('webhooks.secret')}
        onClose={() => setSecret(null)}
      >
        <p className={layout.muted}>{t('webhooks.secretUsage')}</p>
        <p>
          <HelpLink topic="tutorial-webhook-receiver#verify-signature">
            {t('webhooks.secretHowTo')}
          </HelpLink>
        </p>
      </SecretRevealDialog>
      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => (open ? undefined : setDeleting(false))}
        title={t('webhooks.deleteTitle')}
        description={t('webhooks.deleteBody', { url: endpoint.url })}
        confirmLabel={t('webhooks.delete')}
        onConfirm={async () => {
          try {
            await webhooksApi.remove(productId, webhookId, endpoint.version);
            toast.success(t('webhooks.deleted'));
            queryClient.removeQueries({ queryKey: key });
            void queryClient.invalidateQueries({ queryKey: queryKeys.webhooks(productId) });
            void navigate('..', { relative: 'path' });
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </div>
  );
}

function Deliveries({
  productId,
  webhookId,
  selectedId,
  onSelect,
}: {
  productId: string;
  webhookId: string;
  selectedId: string | undefined;
  onSelect: (delivery: WebhookDelivery) => void;
}) {
  const { t } = useTranslation('events');
  const [status, setStatus] = useState<WebhookDeliveryStatus | ''>('');
  const params = { status };
  const { tableProps, query } = useCursorList(
    queryKeys.deliveries(productId, webhookId, params),
    (cursor) => webhooksApi.deliveries(productId, webhookId, { ...params, cursor }),
  );
  const columns: Column<WebhookDelivery>[] = [
    {
      id: 'event',
      header: t('deliveries.event'),
      rowHeader: true,
      cell: (delivery) => (
        <span className={layout.cellStack}>
          <code className={styles.typeCode}>{delivery.event_type}</code>
          <code className={layout.muted}>{delivery.id}</code>
        </span>
      ),
    },
    {
      id: 'status',
      header: (
        <>
          {t('deliveries.status')}{' '}
          <InfoTip label={t('deliveries.statusInfoLabel')} topic="webhooks#delivery-statuses">
            {t('deliveries.statusInfo')}
          </InfoTip>
        </>
      ),
      cell: (delivery) => <DeliveryStatusPill status={delivery.status} />,
    },
    {
      id: 'code',
      header: t('deliveries.responseCode'),
      cell: (delivery) =>
        delivery.response_code ? (
          <code>{delivery.response_code}</code>
        ) : (
          <span className={layout.muted}>—</span>
        ),
    },
    {
      id: 'attempts',
      header: t('jobs.attempts'),
      hideOnMobile: true,
      cell: (delivery) => String(delivery.attempts),
    },
    {
      id: 'duration',
      header: t('deliveries.duration'),
      hideOnMobile: true,
      cell: (delivery) =>
        delivery.duration_ms === null ? '—' : t('deliveries.ms', { value: delivery.duration_ms }),
    },
    {
      id: 'created',
      header: t('jobs.created'),
      hideOnMobile: true,
      cell: (delivery) => <Time value={delivery.created_at} />,
    },
    {
      id: 'details',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (delivery) => (
        <IconButton
          size="sm"
          icon={<PanelRightOpen />}
          label={t('deliveries.open', { id: delivery.id })}
          onClick={() => onSelect(delivery)}
        />
      ),
    },
  ];
  return (
    <Card flush>
      <div className={styles.filters}>
        <FormField label={t('deliveries.status')}>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as WebhookDeliveryStatus | '')}
          >
            <option value="">{t('deliveries.allStatuses')}</option>
            {DELIVERY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`deliveryStatus.${value}`)}
              </option>
            ))}
          </Select>
        </FormField>
        <div className={styles.filterActions}>
          <Button
            icon={<RotateCcw />}
            loading={query.isRefetching}
            onClick={() => void query.refetch()}
          >
            {t('deliveries.refresh')}
          </Button>
        </div>
      </div>
      <DataTable
        caption={t('webhooks.deliveries')}
        columns={columns}
        getRowId={(delivery) => delivery.id}
        selectedRowId={selectedId}
        empty={
          <EmptyState
            compact
            headingLevel={2}
            icon={<Inbox />}
            title={status ? t('deliveries.emptyFiltered') : t('deliveries.empty')}
            description={status ? undefined : t('deliveries.emptyBody')}
            action={
              status ? undefined : (
                <HelpLink topic="webhooks#test">{t('common:help.learnMore')}</HelpLink>
              )
            }
          />
        }
        {...tableProps}
      />
    </Card>
  );
}

function DeliveryDetail({
  productId,
  webhookId,
  delivery,
  canManage,
  onClose,
  onRedelivered,
}: {
  productId: string;
  webhookId: string;
  delivery: WebhookDelivery | null;
  canManage: boolean;
  onClose: () => void;
  onRedelivered: (delivery: WebhookDelivery) => void;
}) {
  const { t } = useTranslation('events');
  const toast = useToast();
  const showError = useErrorToast();
  const detail = useQuery({
    queryKey: [...queryKeys.deliveries(productId, webhookId), 'detail', delivery?.id ?? ''],
    queryFn: () => webhooksApi.delivery(productId, webhookId, delivery?.id ?? ''),
    enabled: Boolean(delivery),
    placeholderData: delivery ?? undefined,
  });
  const redeliver = useMutation({
    mutationFn: (id: string) => webhooksApi.redeliver(productId, webhookId, id),
    onSuccess: (queued) => {
      toast.success(t('deliveries.redelivered'));
      onRedelivered(queued);
    },
    onError: showError,
  });
  const data = detail.data;
  // A pending delivery is queued or in flight; the API answers 409 to a redelivery then.
  const canRedeliver = canManage && data && data.status !== 'pending';
  return (
    <Dialog
      open={delivery !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      variant="drawer"
      title={data?.event_type ?? delivery?.event_type ?? ''}
      description={t('deliveries.subtitle')}
      footer={
        canRedeliver ? (
          <Button
            variant="primary"
            icon={<RotateCcw />}
            loading={redeliver.isPending}
            onClick={() => redeliver.mutate(data.id)}
          >
            {t('deliveries.redeliver')}
          </Button>
        ) : undefined
      }
    >
      {detail.isError ? (
        <ErrorState
          error={detail.error}
          onRetry={() => void detail.refetch()}
          compact
          headingLevel={3}
        />
      ) : data ? (
        <div className={layout.form}>
          <DetailList
            items={[
              { label: t('deliveries.id'), value: data.id, mono: true },
              { label: t('deliveries.status'), value: <DeliveryStatusPill status={data.status} /> },
              { label: t('deliveries.responseCode'), value: data.response_code, mono: true },
              { label: t('jobs.attempts'), value: String(data.attempts) },
              {
                label: t('deliveries.duration'),
                value:
                  data.duration_ms === null
                    ? null
                    : t('deliveries.ms', { value: data.duration_ms }),
              },
              { label: t('deliveries.eventId'), value: data.event_id, mono: true },
              {
                label: t('deliveries.job'),
                value: data.job_id ? (
                  <Link className={layout.link} to={`/p/${productId}/jobs/${data.job_id}`}>
                    <code>{data.job_id}</code>
                  </Link>
                ) : null,
              },
              { label: t('jobs.created'), value: <Time value={data.created_at} mode="absolute" /> },
              {
                label: t('deliveries.deliveredAt'),
                value: data.delivered_at ? (
                  <Time value={data.delivered_at} mode="absolute" />
                ) : null,
              },
              {
                label: t('deliveries.nextAttempt'),
                value: data.next_attempt_at ? (
                  <Time value={data.next_attempt_at} mode="absolute" />
                ) : null,
              },
            ]}
          />
          <h3 className={styles.sectionTitle}>{t('deliveries.lastError')}</h3>
          {data.last_error ? (
            <pre
              className={styles.errorText}
              role="region"
              tabIndex={0}
              aria-label={t('deliveries.lastError')}
            >
              {data.last_error}
            </pre>
          ) : (
            <p className={layout.muted}>{t('jobs.detail.noError')}</p>
          )}
          <h3 className={styles.sectionTitle}>{t('deliveries.responseBody')}</h3>
          {data.response_body ? (
            <pre
              className={styles.responseBody}
              role="region"
              tabIndex={0}
              aria-label={t('deliveries.responseBody')}
            >
              {data.response_body}
            </pre>
          ) : (
            <p className={layout.muted}>{t('deliveries.noBody')}</p>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}

function WebhookSettings({
  productId,
  endpoint,
  canEdit,
  onSaved,
}: {
  productId: string;
  endpoint: WebhookEndpoint;
  canEdit: boolean;
  onSaved: (endpoint: WebhookEndpoint) => void;
}) {
  const { t } = useTranslation('events');
  const toast = useToast();
  const initial: WebhookFormValues = {
    url: endpoint.url,
    description: endpoint.description,
    eventTypes: [...endpoint.event_types].sort(),
    enabled: endpoint.enabled,
  };
  const [values, setValues] = useState(initial);
  const patch: WebhookPatch = {};
  if (values.url.trim() !== initial.url) patch.url = values.url.trim();
  if (values.description.trim() !== initial.description) {
    patch.description = values.description.trim();
  }
  if ([...values.eventTypes].sort().join('\n') !== initial.eventTypes.join('\n')) {
    patch.event_types = values.eventTypes;
  }
  if (values.enabled !== initial.enabled) patch.enabled = values.enabled;
  const changed = Object.keys(patch).length > 0;

  const save = useMutation({
    mutationFn: () => webhooksApi.update(productId, endpoint.id, patch, endpoint.version),
    onSuccess: (updated) => {
      toast.success(t('webhooks.saved'));
      onSaved(updated);
    },
  });
  const fields = save.error ? fieldErrors(save.error) : {};

  if (!canEdit) {
    return (
      <Card>
        <DetailList
          items={[
            { label: t('webhooks.url'), value: endpoint.url, mono: true },
            { label: t('webhooks.descriptionLabel'), value: endpoint.description },
            { label: t('webhooks.eventTypes'), value: <TypeList types={endpoint.event_types} /> },
            {
              label: t('webhooks.tenantFilter'),
              value: endpoint.tenant_id ?? t('webhooks.allTenants'),
            },
            {
              label: t('webhooks.state'),
              value: <StatusPill status={endpoint.enabled ? 'active' : 'disabled'} />,
            },
          ]}
        />
      </Card>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (changed && !webhookFormInvalid(values)) save.mutate();
  };
  return (
    <Card>
      <form
        className={layout.form}
        onSubmit={submit}
        noValidate
        aria-label={t('webhooks.settings')}
      >
        <FormError error={save.error} />
        <WebhookFields productId={productId} values={values} onChange={setValues} fields={fields} />
        <DetailList
          items={[
            {
              label: t('webhooks.tenantFilter'),
              value: endpoint.tenant_id ?? t('webhooks.allTenants'),
              mono: Boolean(endpoint.tenant_id),
            },
            {
              label: t('jobs.created'),
              value: <Time value={endpoint.created_at} mode="absolute" />,
            },
            {
              label: t('jobs.updated'),
              value: <Time value={endpoint.updated_at} mode="absolute" />,
            },
          ]}
        />
        <div className={layout.actions}>
          <Button
            variant="ghost"
            disabled={!changed || save.isPending}
            onClick={() => {
              setValues(initial);
              save.reset();
            }}
          >
            {t('webhooks.discard')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Save />}
            loading={save.isPending}
            disabled={!changed || webhookFormInvalid(values)}
          >
            {t('common:actions.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
