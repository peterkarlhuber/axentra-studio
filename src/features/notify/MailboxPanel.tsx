import { useQuery } from '@tanstack/react-query';
import { Inbox, MailX, PanelRightOpen, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import type { NotifyMailboxEntry } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import {
  Button,
  Card,
  DataTable,
  DetailList,
  Dialog,
  EmptyState,
  FormField,
  IconButton,
  Input,
  Skeleton,
  Time,
  layout,
  type Column,
} from '@/components/ui';
import { useCursorList } from '@/lib/useCursorList';
import { RenderedView } from './RenderedView';
import styles from './notify.module.css';

/**
 * What the local development provider "delivered" (`GET /notify/mailbox`). The endpoint exists
 * only with `notify.provider = "local"`; with a real provider the panel says so.
 */
export function MailboxPanel({ productId }: { productId: string }) {
  const { t } = useTranslation('notify');
  const stats = useQuery({
    queryKey: queryKeys.notifyStats(productId),
    queryFn: () => notifyApi.stats(productId),
  });
  const provider = stats.data?.provider;

  if (stats.isPending) {
    return (
      <Card title={t('mailbox.title')}>
        <Skeleton height={80} />
      </Card>
    );
  }
  if (provider && provider !== 'local') {
    return <MailboxUnavailable provider={provider} />;
  }
  return <MailboxList productId={productId} />;
}

function MailboxUnavailable({ provider }: { provider?: string }) {
  const { t } = useTranslation('notify');
  return (
    <Card title={t('mailbox.title')}>
      <EmptyState
        compact
        headingLevel={3}
        icon={<MailX />}
        title={t('mailbox.unavailableTitle')}
        description={
          provider
            ? t('mailbox.unavailableBody', { provider })
            : t('mailbox.unavailableBodyUnknown')
        }
      />
    </Card>
  );
}

function MailboxList({ productId }: { productId: string }) {
  const { t } = useTranslation('notify');
  const [draft, setDraft] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selected, setSelected] = useState<NotifyMailboxEntry | null>(null);
  const { query, tableProps } = useCursorList(
    queryKeys.notifyMailbox(productId, { recipient }),
    (cursor) => notifyApi.mailbox(productId, { recipient, cursor }),
  );

  if (isApiError(query.error) && query.error.code === 'mode_not_supported') {
    return <MailboxUnavailable />;
  }

  const columns: Column<NotifyMailboxEntry>[] = [
    { id: 'time', header: t('fields.created'), cell: (entry) => <Time value={entry.created_at} /> },
    {
      id: 'subject',
      header: t('preview.subject'),
      rowHeader: true,
      cell: (entry) => entry.subject,
    },
    {
      id: 'recipient',
      header: t('fields.recipient'),
      hideOnMobile: true,
      cell: (entry) => <span className={layout.mono}>{entry.recipient}</span>,
    },
    {
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (entry) => (
        <IconButton
          size="sm"
          icon={<PanelRightOpen />}
          label={t('mailbox.openNamed', { subject: entry.subject })}
          onClick={() => setSelected(entry)}
        />
      ),
    },
  ];

  const apply = (event: FormEvent) => {
    event.preventDefault();
    setRecipient(draft.trim());
  };

  return (
    <Card flush title={t('mailbox.title')} description={t('mailbox.description')}>
      <form className={styles.filters} onSubmit={apply} aria-label={t('mailbox.filters')}>
        <FormField label={t('fields.recipient')}>
          <Input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
            placeholder="ada@example.com"
          />
        </FormField>
        <div className={styles.filterActions}>
          <Button type="submit" variant="primary" icon={<Search />}>
            {t('messages.apply')}
          </Button>
        </div>
      </form>
      <DataTable
        caption={t('mailbox.title')}
        columns={columns}
        getRowId={(entry) => entry.id}
        selectedRowId={selected?.id}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Inbox />}
            title={t('mailbox.empty')}
            description={t('mailbox.emptyBody')}
          />
        }
        {...tableProps}
      />
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => (open ? undefined : setSelected(null))}
        variant="drawer"
        title={selected?.subject ?? ''}
        description={t('mailbox.detailSubtitle')}
      >
        {selected ? (
          <div className={layout.form}>
            <DetailList
              items={[
                { label: t('mailbox.from'), value: selected.sender, mono: true },
                { label: t('mailbox.to'), value: selected.recipient, mono: true },
                {
                  label: t('fields.created'),
                  value: <Time value={selected.created_at} mode="absolute" />,
                },
                { label: t('fields.messageId'), value: selected.message_id, mono: true },
                {
                  label: t('fields.providerMessageId'),
                  value: selected.provider_message_id,
                  mono: true,
                },
              ]}
            />
            <RenderedView
              subject={selected.subject}
              html={selected.html}
              text={selected.text}
              label={t('mailbox.content')}
            />
          </div>
        ) : null}
      </Dialog>
    </Card>
  );
}
