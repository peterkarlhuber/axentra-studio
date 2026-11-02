import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { notifyApi } from '@/api/endpoints';
import type { NotifyTemplate } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import { canInAnyTenant } from '@/app/permissions';
import {
  Badge,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  IconButton,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { sortLocales } from './notify-utils';
import { SendTestDialog } from './SendTestDialog';

export function TemplatesPanel({ productId }: { productId: string }) {
  const { t } = useTranslation('notify');
  const can = useCan();
  const { access } = useProductScope();
  const canSend = can('notify:send') || canInAnyTenant(access, 'notify:send');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<NotifyTemplate | null>(null);
  const [sending, setSending] = useState<NotifyTemplate | null>(null);
  const templates = useQuery({
    queryKey: queryKeys.notifyTemplates(productId),
    queryFn: () => notifyApi.templates(productId),
  });

  const columns: Column<NotifyTemplate>[] = [
    {
      id: 'name',
      header: t('fields.template'),
      rowHeader: true,
      cell: (template) => (
        <span className={layout.cellStack}>
          <Link to={`templates/${encodeURIComponent(template.key)}`} className={layout.link}>
            {template.name || template.key}
          </Link>
          <code className={layout.muted}>{template.key}</code>
        </span>
      ),
    },
    {
      id: 'category',
      header: t('fields.category'),
      hideOnMobile: true,
      cell: (template) => <Badge>{template.category}</Badge>,
    },
    {
      id: 'locales',
      header: t('fields.locales'),
      hideOnMobile: true,
      cell: (template) => (
        <span className={layout.tags}>
          {sortLocales(Object.keys(template.variants)).map((locale) => (
            <Badge key={locale} tone="info">
              {locale}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      id: 'version',
      header: t('fields.version'),
      cell: (template) =>
        template.builtin ? (
          <Badge tone="brand">{t('templates.builtin')}</Badge>
        ) : (
          <span className={layout.tags}>
            <Badge>{t('templates.versionShort', { version: template.version })}</Badge>
            {template.sensitive ? <Badge tone="warning">{t('fields.sensitive')}</Badge> : null}
          </span>
        ),
    },
    {
      id: 'updated',
      header: t('fields.updated'),
      hideOnMobile: true,
      cell: (template) => <Time value={template.updated_at} />,
    },
    {
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (template) => (
        <span className={layout.tags}>
          {canSend ? (
            <IconButton
              size="sm"
              icon={<Send />}
              label={t('send.openNamed', { name: template.name || template.key })}
              onClick={() => setSending(template)}
            />
          ) : null}
          {!template.builtin && template.id ? (
            <IconButton
              size="sm"
              variant="danger"
              icon={<Trash2 />}
              label={t('templates.deleteNamed', { name: template.name || template.key })}
              onClick={() => setDeleting(template)}
            />
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <Card flush title={t('templates.title')} description={t('templates.description')}>
      <DataTable
        caption={t('templates.title')}
        columns={columns}
        rows={templates.data}
        getRowId={(template) => template.key}
        status={templates.status}
        error={templates.error}
        onRetry={() => void templates.refetch()}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Mail />}
            title={t('templates.empty')}
            description={t('templates.emptyBody')}
          />
        }
      />
      {sending ? (
        <SendTestDialog productId={productId} template={sending} onClose={() => setSending(null)} />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title={t('templates.deleteTitle')}
        description={t('templates.deleteBody', { key: deleting?.key })}
        confirmLabel={t('templates.delete')}
        confirmText={deleting?.key}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await notifyApi.deleteTemplate(productId, deleting.key, deleting.version);
            toast.success(t('templates.deleted', { key: deleting.key }));
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifyTemplates(productId) });
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </Card>
  );
}
