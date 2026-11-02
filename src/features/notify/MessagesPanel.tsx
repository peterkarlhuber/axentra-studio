import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FilterX, Inbox, PanelRightOpen, RotateCcw, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyApi, type NotifyMessageListParams } from '@/api/endpoints';
import type { NotifyMessage, NotifyMessageStatus } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import {
  Badge,
  Button,
  Card,
  DataTable,
  DetailList,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  Input,
  Select,
  Skeleton,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { useCursorList } from '@/lib/useCursorList';
import { MESSAGE_STATUSES, messageTone } from './notify-utils';
import { RenderedView } from './RenderedView';
import styles from './notify.module.css';

interface Filters {
  status: NotifyMessageStatus | '';
  template_key: string;
  recipient: string;
  tenant_id: string;
}
const EMPTY: Filters = { status: '', template_key: '', recipient: '', tenant_id: '' };

function useRetry(productId: string) {
  const { t } = useTranslation('notify');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: NotifyMessage) => notifyApi.retry(productId, message.id),
    onSuccess: (message) => {
      toast.success(t('messages.retried', { status: t(`status.${message.status}`) }));
      queryClient.setQueryData(queryKeys.notifyMessage(productId, message.id), message);
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'notify'] });
    },
    onError: showError,
  });
}

/** The outbox (`GET /notify/messages`) with status, attempts and the redacted last error. */
export function MessagesPanel({ productId }: { productId: string }) {
  const { t } = useTranslation('notify');
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [selected, setSelected] = useState<NotifyMessage | null>(null);
  const retry = useRetry(productId);
  const params: NotifyMessageListParams = { ...applied };
  const { tableProps } = useCursorList(queryKeys.notifyMessages(productId, params), (cursor) =>
    notifyApi.messages(productId, { ...params, cursor }),
  );
  const active = Object.values(applied).filter(Boolean).length;

  const apply = (event: FormEvent) => {
    event.preventDefault();
    setApplied({
      ...draft,
      template_key: draft.template_key.trim(),
      recipient: draft.recipient.trim(),
    });
  };
  const set = (key: keyof Filters) => (event: { target: { value: string } }) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }));

  const columns: Column<NotifyMessage>[] = [
    {
      id: 'created',
      header: t('fields.created'),
      cell: (message) => <Time value={message.created_at} />,
    },
    {
      id: 'template',
      header: t('fields.template'),
      rowHeader: true,
      cell: (message) => (
        <span className={layout.cellStack}>
          <code>{message.template_key}</code>
          <span className={layout.muted}>
            {t('templates.versionShort', { version: message.template_version })} · {message.locale}
          </span>
        </span>
      ),
    },
    {
      id: 'recipient',
      header: t('fields.recipient'),
      hideOnMobile: true,
      cell: (message) => <span className={layout.mono}>{message.recipient}</span>,
    },
    {
      id: 'status',
      header: t('fields.status'),
      cell: (message) => (
        <Badge tone={messageTone(message.status)}>{t(`status.${message.status}`)}</Badge>
      ),
    },
    {
      id: 'attempts',
      header: t('fields.attempts'),
      hideOnMobile: true,
      cell: (message) =>
        t('messages.attemptsOf', { attempts: message.attempts, max: message.max_attempts }),
    },
    {
      id: 'error',
      header: t('fields.lastError'),
      hideOnMobile: true,
      cell: (message) =>
        message.last_error ? (
          <span className={styles.error} title={message.last_error}>
            {message.last_error}
          </span>
        ) : null,
    },
    {
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (message) => (
        <span className={layout.tags}>
          {message.status === 'failed' ? (
            <IconButton
              size="sm"
              icon={<RotateCcw />}
              label={t('messages.retryNamed', { id: message.id })}
              loading={retry.isPending && retry.variables?.id === message.id}
              onClick={() => retry.mutate(message)}
            />
          ) : null}
          <IconButton
            size="sm"
            icon={<PanelRightOpen />}
            label={t('messages.openNamed', { id: message.id })}
            onClick={() => setSelected(message)}
          />
        </span>
      ),
    },
  ];

  return (
    <Card flush title={t('messages.title')} description={t('messages.description')}>
      <form className={styles.filters} onSubmit={apply} aria-label={t('messages.filters')}>
        <FormField label={t('fields.status')}>
          <Select value={draft.status} onChange={set('status')}>
            <option value="">{t('messages.allStatuses')}</option>
            {MESSAGE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t('fields.templateKey')}>
          <Input
            value={draft.template_key}
            onChange={set('template_key')}
            spellCheck={false}
            placeholder="welcome"
          />
        </FormField>
        <FormField label={t('fields.recipient')}>
          <Input
            type="search"
            value={draft.recipient}
            onChange={set('recipient')}
            spellCheck={false}
            placeholder="ada@example.com"
          />
        </FormField>
        <TenantPicker
          productId={productId}
          value={draft.tenant_id}
          onChange={(tenantId) => setDraft((current) => ({ ...current, tenant_id: tenantId }))}
          allowNone
          noneLabel={t('messages.allTenants')}
        />
        <div className={styles.filterActions}>
          <Button type="submit" variant="primary" icon={<Search />}>
            {t('messages.apply')}
          </Button>
          {active > 0 ? (
            <Button
              variant="ghost"
              icon={<FilterX />}
              onClick={() => {
                setDraft(EMPTY);
                setApplied(EMPTY);
              }}
            >
              {t('messages.reset')}
            </Button>
          ) : null}
        </div>
      </form>
      <DataTable
        caption={t('messages.title')}
        columns={columns}
        getRowId={(message) => message.id}
        selectedRowId={selected?.id}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Inbox />}
            title={active ? t('messages.emptyFiltered') : t('messages.empty')}
            description={active ? undefined : t('messages.emptyBody')}
          />
        }
        {...tableProps}
      />
      <MessageDetail
        productId={productId}
        message={selected}
        onClose={() => setSelected(null)}
        onRetry={(message) => retry.mutate(message)}
        retrying={retry.isPending}
      />
    </Card>
  );
}

function MessageDetail({
  productId,
  message,
  onClose,
  onRetry,
  retrying,
}: {
  productId: string;
  message: NotifyMessage | null;
  onClose: () => void;
  onRetry: (message: NotifyMessage) => void;
  retrying: boolean;
}) {
  const { t } = useTranslation('notify');
  const detail = useQuery({
    queryKey: queryKeys.notifyMessage(productId, message?.id ?? ''),
    queryFn: () => notifyApi.message(productId, message?.id ?? ''),
    enabled: Boolean(message),
  });
  const data = detail.data ?? message;

  return (
    <Dialog
      open={message !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      variant="drawer"
      title={message?.template_key ?? ''}
      description={t('messages.detailSubtitle')}
      footer={
        data?.status === 'failed' ? (
          <Button icon={<RotateCcw />} loading={retrying} onClick={() => onRetry(data)}>
            {t('messages.retry')}
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
              { label: t('fields.id'), value: data.id, mono: true },
              {
                label: t('fields.status'),
                value: <Badge tone={messageTone(data.status)}>{t(`status.${data.status}`)}</Badge>,
              },
              { label: t('fields.recipient'), value: data.recipient, mono: true },
              { label: t('fields.recipientUser'), value: data.recipient_user_id, mono: true },
              { label: t('fields.tenant'), value: data.tenant_id, mono: true },
              {
                label: t('fields.template'),
                value: `${data.template_key} · ${t('templates.versionShort', { version: data.template_version })}`,
                mono: true,
              },
              { label: t('fields.category'), value: data.category },
              { label: t('fields.locale'), value: data.locale, mono: true },
              {
                label: t('fields.attempts'),
                value: t('messages.attemptsOf', {
                  attempts: data.attempts,
                  max: data.max_attempts,
                }),
              },
              {
                label: t('fields.nextAttempt'),
                value: data.next_attempt_at ? (
                  <Time value={data.next_attempt_at} mode="absolute" />
                ) : null,
              },
              {
                label: t('fields.created'),
                value: <Time value={data.created_at} mode="absolute" />,
              },
              {
                label: t('fields.sentAt'),
                value: data.sent_at ? <Time value={data.sent_at} mode="absolute" /> : null,
              },
              { label: t('fields.provider'), value: data.provider, mono: true },
              { label: t('fields.providerMessageId'), value: data.provider_message_id, mono: true },
              { label: t('fields.idempotencyKey'), value: data.idempotency_key, mono: true },
            ]}
          />
          <h3 className={styles.sectionTitle}>{t('fields.lastError')}</h3>
          {data.last_error ? (
            <pre className={styles.errorFull}>{data.last_error}</pre>
          ) : (
            <p className={layout.muted}>{t('messages.noError')}</p>
          )}
          <p className={layout.muted}>{t('messages.redactedHint')}</p>
          <h3 className={styles.sectionTitle}>{t('messages.content')}</h3>
          {detail.isPending ? (
            <Skeleton height={120} />
          ) : data.content ? (
            <RenderedView
              subject={data.content.subject}
              html={data.content.html}
              text={data.content.text}
              label={t('messages.content')}
            />
          ) : (
            <p className={layout.muted}>{t(`contentState.${data.content_state}`)}</p>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}
