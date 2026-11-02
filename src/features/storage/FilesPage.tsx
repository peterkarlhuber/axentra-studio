import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, FolderOpen, Lock, MoreHorizontal, Trash2, Upload, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { filesApi, settingsApi, storageApi, type FileSort } from '@/api/endpoints';
import type { FileInfo } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Time,
  layout,
  toSortParam,
  useToast,
  type Column,
  type SortState,
} from '@/components/ui';
import menuStyles from '@/components/ui/IconButton.module.css';
import { useFormatters } from '@/lib/format';
import { useCursorList } from '@/lib/useCursorList';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { parseFilterValue } from '@/features/records/records-utils';
import { FileDetailDrawer } from './FileDetailDrawer';
import { formatBytes, storageLimits } from './storage-utils';
import { TenantStorageCard } from './TenantStorageCard';
import { UploadDialog } from './UploadDialog';
import { useFileDownload } from './useFileDownload';
import styles from './storage.module.css';

export function FilesPage() {
  const { t } = useTranslation('storage');
  const { productId } = useProductScope();
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const tenantId = params.get('tenant') ?? '';

  const update = (changes: Record<string, string>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key),
        );
        return next;
      },
      { replace: true },
    );

  const canRead = tenantId ? can('files:read', { tenantId }) : false;
  const canWrite = tenantId ? can('files:write', { tenantId }) : false;
  const uploading = params.get('upload') === '1' && canWrite;

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('files.title')}
        description={t('files.description')}
        actions={
          canWrite ? (
            <Button variant="primary" icon={<Upload />} onClick={() => update({ upload: '1' })}>
              {t('actions.upload')}
            </Button>
          ) : null
        }
      />
      <Card>
        <div className={layout.row}>
          <TenantPicker
            productId={productId}
            value={tenantId}
            onChange={(id) => update({ tenant: id, file: '', upload: '' })}
          />
        </div>
      </Card>
      {!tenantId ? (
        <Card>
          <EmptyState
            headingLevel={2}
            icon={<FolderOpen />}
            title={t('files.pickTitle')}
            description={t('files.pickBody')}
          />
        </Card>
      ) : !canRead ? (
        <Card>
          <EmptyState
            headingLevel={2}
            icon={<Lock />}
            title={t('files.noAccessTitle')}
            description={t('files.noAccessBody')}
          />
        </Card>
      ) : (
        <TenantFiles
          key={tenantId}
          productId={productId}
          tenantId={tenantId}
          canWrite={canWrite}
          canEditQuota={can('tenants:update', { tenantId })}
          canReadSettings={can('platform:settings') || can('product:manage')}
          uploading={uploading}
          selectedFileId={params.get('file')}
          onSelect={(fileId) => update({ file: fileId ?? '' })}
          onUploadClose={() => update({ upload: '' })}
        />
      )}
    </div>
  );
}

function TenantFiles({
  productId,
  tenantId,
  canWrite,
  canEditQuota,
  canReadSettings,
  uploading,
  selectedFileId,
  onSelect,
  onUploadClose,
}: {
  productId: string;
  tenantId: string;
  canWrite: boolean;
  canEditQuota: boolean;
  canReadSettings: boolean;
  uploading: boolean;
  selectedFileId: string | null;
  onSelect: (fileId: string | null) => void;
  onUploadClose: () => void;
}) {
  const { t } = useTranslation('storage');
  const format = useFormatters();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<SortState | null>({ key: 'created_at', direction: 'desc' });
  const [q, setQ] = useState('');
  const [contentType, setContentType] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [labelKey, setLabelKey] = useState('');
  const [labelValue, setLabelValue] = useState('');
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [deleting, setDeleting] = useState<FileInfo | null>(null);
  const debounced = useDebouncedValue(
    { q: q.trim(), content_type: contentType.trim(), created_by: createdBy.trim() },
    300,
  );
  const query = { ...debounced, metadata, sort: toSortParam(sort) as FileSort | undefined };
  const { tableProps } = useCursorList(queryKeys.files(productId, tenantId, query), (cursor) =>
    filesApi.list(productId, tenantId, { ...query, cursor }),
  );
  const download = useFileDownload(productId, tenantId);
  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
    enabled: canReadSettings,
    staleTime: 5 * 60_000,
  });
  // Shared with TenantStorageCard (same key): used for the upload dialog's quota warning.
  const usage = useQuery({
    queryKey: queryKeys.tenantStorage(productId, tenantId),
    queryFn: () => storageApi.tenantUsage(productId, tenantId),
  });

  const addLabel = (event: FormEvent) => {
    event.preventDefault();
    if (!labelKey.trim()) return;
    setMetadata((current) => ({ ...current, [labelKey.trim()]: parseFilterValue(labelValue) }));
    setLabelKey('');
    setLabelValue('');
  };

  const columns: Column<FileInfo>[] = [
    {
      id: 'name',
      header: t('fields.name'),
      sortKey: 'name',
      rowHeader: true,
      cell: (file) => (
        <button type="button" className={styles.nameButton} onClick={() => onSelect(file.id)}>
          {file.name}
        </button>
      ),
    },
    {
      id: 'type',
      header: t('fields.type'),
      hideOnMobile: true,
      cell: (file) => <code className={layout.mono}>{file.content_type}</code>,
    },
    {
      id: 'size',
      header: t('fields.size'),
      sortKey: 'size',
      align: 'end',
      cell: (file) => formatBytes(file.size, format.locale),
    },
    {
      id: 'created',
      header: t('fields.created'),
      sortKey: 'created_at',
      hideOnMobile: true,
      cell: (file) => <Time value={file.created_at} />,
    },
    {
      id: 'expires',
      header: t('fields.expires'),
      hideOnMobile: true,
      cell: (file) => (file.expires_at ? <Time value={file.expires_at} /> : t('fields.never')),
    },
    {
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (file) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`${menuStyles.iconButton} ${menuStyles.sm}`}
            aria-label={t('actions.for', { name: file.name })}
          >
            <MoreHorizontal aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Eye />} onSelect={() => onSelect(file.id)}>
              {t('actions.details')}
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Download />} onSelect={() => download.mutate(file)}>
              {t('actions.download')}
            </DropdownMenuItem>
            {canWrite ? (
              <DropdownMenuItem tone="danger" icon={<Trash2 />} onSelect={() => setDeleting(file)}>
                {t('actions.delete')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <TenantStorageCard productId={productId} tenantId={tenantId} canEditQuota={canEditQuota} />
      <Card flush title={t('files.listTitle')} description={t('files.listDescription')}>
        <div className={layout.toolbar} role="search" aria-label={t('filter.label')}>
          <FormField label={t('filter.name')}>
            <Input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              maxLength={200}
            />
          </FormField>
          <FormField label={t('filter.type')} help={t('filter.typeHelp')}>
            <Input
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
              spellCheck={false}
              placeholder="image/*"
            />
          </FormField>
          <FormField label={t('filter.createdBy')} help={t('filter.createdByHelp')}>
            <Input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              spellCheck={false}
            />
          </FormField>
        </div>
        <form className={layout.toolbar} onSubmit={addLabel} aria-label={t('filter.labelForm')}>
          <FormField label={t('filter.labelKey')}>
            <Input
              value={labelKey}
              onChange={(event) => setLabelKey(event.target.value)}
              spellCheck={false}
              placeholder="kind"
            />
          </FormField>
          <FormField label={t('filter.labelValue')} help={t('filter.labelValueHelp')}>
            <Input
              value={labelValue}
              onChange={(event) => setLabelValue(event.target.value)}
              spellCheck={false}
            />
          </FormField>
          <Button type="submit" disabled={!labelKey.trim()}>
            {t('filter.addLabel')}
          </Button>
        </form>
        {Object.keys(metadata).length > 0 ? (
          <ul className={styles.filters} aria-label={t('filter.active')}>
            {Object.entries(metadata).map(([key, value]) => (
              <li key={key} className={styles.filterChip}>
                <code>
                  {key} = {JSON.stringify(value)}
                </code>
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={t('filter.remove', { field: key })}
                  onClick={() =>
                    setMetadata((current) =>
                      Object.fromEntries(Object.entries(current).filter(([name]) => name !== key)),
                    )
                  }
                >
                  <X aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <DataTable
          caption={t('files.tableCaption')}
          columns={columns}
          getRowId={(file) => file.id}
          sort={sort}
          onSortChange={setSort}
          selectedRowId={selectedFileId}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<FolderOpen />}
              title={t('files.empty')}
              description={canWrite ? t('files.emptyBody') : undefined}
            />
          }
          {...tableProps}
        />
      </Card>
      <FileDetailDrawer
        productId={productId}
        tenantId={tenantId}
        fileId={selectedFileId}
        canWrite={canWrite}
        onClose={() => onSelect(null)}
        onDelete={setDeleting}
      />
      {uploading ? (
        <UploadDialog
          productId={productId}
          tenantId={tenantId}
          limits={storageLimits(settings.data)}
          usage={usage.data}
          onClose={onUploadClose}
          onUploaded={(file) => {
            toast.success(t('upload.done', { name: file.name }));
            onUploadClose();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title={t('delete.title')}
        description={t('delete.body', { name: deleting?.name })}
        confirmLabel={t('actions.delete')}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await filesApi.remove(productId, tenantId, deleting.id, deleting.version);
            toast.success(t('delete.done', { name: deleting.name }));
            if (selectedFileId === deleting.id) onSelect(null);
            queryClient.removeQueries({
              queryKey: queryKeys.file(productId, tenantId, deleting.id),
            });
            void queryClient.invalidateQueries({
              queryKey: ['products', productId, 'files', tenantId],
            });
            void queryClient.invalidateQueries({ queryKey: ['products', productId, 'storage'] });
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      >
        <p className={layout.muted}>{t('delete.note')}</p>
      </ConfirmDialog>
    </>
  );
}
