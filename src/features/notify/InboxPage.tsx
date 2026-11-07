import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Inbox, MailCheck, PanelRightOpen } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyApi } from '@/api/endpoints';
import type { InboxEntry } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Badge,
  Button,
  Card,
  DataTable,
  DetailList,
  Dialog,
  EmptyState,
  IconButton,
  PageHeader,
  Switch,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { HelpLink } from '@/help/HelpLink';
import { useCursorList } from '@/lib/useCursorList';
import { useInboxUnread } from './useInboxUnread';
import styles from './notify.module.css';

/**
 * The signed-in user's in-app notifications in this product (templates with the channel
 * `inbox`, `GET .../notify/inbox/me`), product-wide or for one tenant, newest first. Opening a
 * notification marks it as read; "Mark all as read" marks every unread one in the scope.
 */
export function InboxPage() {
  const { t } = useTranslation('notify');
  const { productId } = useProductScope();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<InboxEntry | null>(null);
  const params = { tenant_id: tenantId, unread_only: unreadOnly };
  const { tableProps } = useCursorList(queryKeys.notifyInboxList(productId, params), (cursor) =>
    notifyApi.inbox(productId, { ...params, cursor }),
  );
  const unread = useInboxUnread(productId, tenantId || undefined);
  const unreadCount = unread.data?.unread ?? 0;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notifyInbox(productId) });

  const markRead = useMutation({
    mutationFn: (ids?: string[]) => notifyApi.markInboxRead(productId, ids, tenantId || undefined),
    onSuccess: (result, ids) => {
      if (!ids) toast.success(t('inbox.markedAll', { count: result.marked }));
      void refresh();
    },
    onError: showError,
  });

  const open = (entry: InboxEntry) => {
    setSelected(entry);
    if (!entry.read_at) markRead.mutate([entry.id]);
  };

  const columns: Column<InboxEntry>[] = [
    {
      id: 'subject',
      header: t('inbox.notification'),
      rowHeader: true,
      cell: (entry) => (
        <span className={layout.cellStack}>
          <span className={entry.read_at ? undefined : styles.unread}>
            {entry.read_at ? null : (
              <>
                <span className={styles.unreadDot} aria-hidden="true" />
                <span className="ax-sr-only">{t('inbox.unreadMark')} </span>
              </>
            )}
            {entry.subject ?? <span className={layout.muted}>{t('inbox.noSubject')}</span>}
          </span>
          {entry.text ? <span className={styles.excerpt}>{entry.text}</span> : null}
        </span>
      ),
    },
    {
      id: 'category',
      header: t('fields.category'),
      hideOnMobile: true,
      cell: (entry) => <Badge>{entry.category}</Badge>,
    },
    {
      id: 'received',
      header: t('inbox.received'),
      cell: (entry) => <Time value={entry.created_at} />,
    },
    {
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (entry) => {
        const name = entry.subject ?? t('inbox.noSubject');
        return (
          <span className={styles.rowActions}>
            {entry.read_at ? null : (
              <IconButton
                size="sm"
                icon={<MailCheck />}
                label={t('inbox.markReadNamed', { subject: name })}
                disabled={markRead.isPending}
                onClick={() => markRead.mutate([entry.id])}
              />
            )}
            <IconButton
              size="sm"
              icon={<PanelRightOpen />}
              label={t('inbox.openNamed', { subject: name })}
              onClick={() => open(entry)}
            />
          </span>
        );
      },
    },
  ];

  const filtered = unreadOnly;

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('inbox.title')}
        description={t('inbox.description')}
        help="notifications#inbox"
        meta={
          unread.data ? (
            <Badge tone={unreadCount > 0 ? 'info' : 'neutral'}>
              {t('inbox.unreadCount', { count: unreadCount })}
            </Badge>
          ) : null
        }
        actions={
          <Button
            icon={<CheckCheck />}
            disabled={unreadCount === 0}
            loading={markRead.isPending && markRead.variables === undefined}
            onClick={() => markRead.mutate(undefined)}
          >
            {t('inbox.markAll')}
          </Button>
        }
      />
      <Card flush>
        <div className={styles.filters}>
          <TenantPicker
            productId={productId}
            value={tenantId}
            onChange={setTenantId}
            allowNone
            noneLabel={t('inbox.productWide')}
            label={t('inbox.scope')}
            help={t('inbox.scopeHelp')}
          />
          <Switch
            checked={unreadOnly}
            onCheckedChange={setUnreadOnly}
            label={t('inbox.unreadOnly')}
          />
        </div>
        <DataTable
          caption={t('inbox.title')}
          columns={columns}
          getRowId={(entry) => entry.id}
          selectedRowId={selected?.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<Inbox />}
              title={filtered ? t('inbox.emptyUnread') : t('inbox.empty')}
              description={
                filtered ? undefined : (
                  <>
                    {t('inbox.emptyBody')}{' '}
                    <HelpLink topic="notifications#inbox">{t('common:help.learnMore')}</HelpLink>
                  </>
                )
              }
            />
          }
          {...tableProps}
        />
      </Card>
      <Dialog
        open={selected !== null}
        onOpenChange={(next) => (next ? undefined : setSelected(null))}
        variant="drawer"
        title={selected?.subject ?? t('inbox.noSubject')}
        description={t('inbox.detailSubtitle')}
      >
        {selected ? (
          <div className={layout.form}>
            <DetailList
              items={[
                {
                  label: t('inbox.received'),
                  value: <Time value={selected.created_at} mode="absolute" />,
                },
                { label: t('fields.category'), value: selected.category },
                { label: t('fields.template'), value: selected.template_key, mono: true },
                {
                  label: t('inbox.tenant'),
                  value: selected.tenant_id ?? t('inbox.noTenant'),
                  mono: Boolean(selected.tenant_id),
                },
              ]}
            />
            {selected.content_state === 'available' && selected.text !== null ? (
              <pre className={styles.message}>{selected.text}</pre>
            ) : (
              <p className={styles.noHtml}>{t(`contentState.${selected.content_state}`)}</p>
            )}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
