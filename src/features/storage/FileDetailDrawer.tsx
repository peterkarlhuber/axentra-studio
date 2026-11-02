import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Link2, Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { filesApi } from '@/api/endpoints';
import type { DownloadUrl, FileInfo } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import {
  Alert,
  Button,
  CopyField,
  DetailList,
  Dialog,
  ErrorState,
  FormField,
  Input,
  JsonView,
  Skeleton,
  StatusPill,
  Textarea,
  Time,
  layout,
  useToast,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import { formatBytes, parseMetadata } from './storage-utils';
import { useFileDownload } from './useFileDownload';

export function FileDetailDrawer({
  productId,
  tenantId,
  fileId,
  canWrite,
  onClose,
  onDelete,
}: {
  productId: string;
  tenantId: string;
  fileId: string | null;
  canWrite: boolean;
  onClose: () => void;
  onDelete: (file: FileInfo) => void;
}) {
  const { t } = useTranslation('storage');
  const format = useFormatters();
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState<DownloadUrl | null>(null);
  const showError = useErrorToast();
  const file = useQuery({
    queryKey: queryKeys.file(productId, tenantId, fileId ?? ''),
    queryFn: () => filesApi.get(productId, tenantId, fileId ?? ''),
    enabled: Boolean(fileId),
  });
  const download = useFileDownload(productId, tenantId);
  const share = useMutation({
    mutationFn: (info: FileInfo) => filesApi.downloadUrl(productId, tenantId, info.id),
    onSuccess: setLink,
    onError: showError,
  });

  const close = () => {
    setEditing(false);
    setLink(null);
    onClose();
  };

  const info = file.data;
  return (
    <Dialog
      open={fileId !== null}
      onOpenChange={(open) => (open ? undefined : close())}
      variant="drawer"
      title={info?.name ?? t('detail.title')}
      description={fileId ?? undefined}
    >
      {file.isPending ? (
        <div className={layout.form} aria-busy="true">
          <Skeleton />
          <Skeleton width="70%" />
          <Skeleton width="50%" />
        </div>
      ) : file.isError ? (
        <ErrorState
          error={file.error}
          onRetry={() => void file.refetch()}
          compact
          headingLevel={3}
        />
      ) : info ? (
        <div className={layout.form}>
          <div className={layout.actions}>
            <Button
              variant="primary"
              icon={<Download />}
              loading={download.isPending}
              onClick={() => download.mutate(info)}
            >
              {t('actions.download')}
            </Button>
            <Button icon={<Link2 />} loading={share.isPending} onClick={() => share.mutate(info)}>
              {t('actions.createLink')}
            </Button>
            {canWrite ? (
              <>
                <Button icon={<Pencil />} onClick={() => setEditing(true)} disabled={editing}>
                  {t('actions.edit')}
                </Button>
                <Button variant="danger" icon={<Trash2 />} onClick={() => onDelete(info)}>
                  {t('actions.delete')}
                </Button>
              </>
            ) : null}
          </div>
          {link ? (
            <Alert tone="info" title={t('link.title')}>
              <p>{t('link.body')}</p>
              <CopyField label={t('link.url')} value={link.url} />
              <p>
                {t('link.expires')}: <Time value={link.expires_at} mode="absolute" />
                {link.kind === 'presigned' ? ` · ${t('link.presigned')}` : null}
              </p>
            </Alert>
          ) : null}
          {editing ? (
            <EditFileForm
              productId={productId}
              tenantId={tenantId}
              file={info}
              onDone={() => setEditing(false)}
            />
          ) : null}
          <DetailList
            items={[
              { label: t('fields.name'), value: info.name },
              { label: t('fields.id'), value: info.id, mono: true },
              { label: t('fields.status'), value: <StatusPill status={info.status} /> },
              { label: t('fields.type'), value: info.content_type, mono: true },
              {
                label: t('fields.size'),
                value: `${formatBytes(info.size, format.locale)} (${t('fields.bytes', {
                  count: info.size,
                  formatted: format.number(info.size),
                })})`,
              },
              { label: t('fields.sha256'), value: info.sha256, mono: true },
              { label: t('fields.version'), value: info.version },
              { label: t('fields.createdBy'), value: info.created_by, mono: true },
              {
                label: t('fields.created'),
                value: <Time value={info.created_at} mode="absolute" />,
              },
              {
                label: t('fields.updated'),
                value: <Time value={info.updated_at} mode="absolute" />,
              },
              {
                label: t('fields.expires'),
                value: info.expires_at ? (
                  <Time value={info.expires_at} mode="absolute" />
                ) : (
                  t('fields.never')
                ),
              },
            ]}
          />
          <JsonView value={info.metadata ?? {}} label={t('fields.metadata')} />
        </div>
      ) : null}
    </Dialog>
  );
}

function EditFileForm({
  productId,
  tenantId,
  file,
  onDone,
}: {
  productId: string;
  tenantId: string;
  file: FileInfo;
  onDone: () => void;
}) {
  const { t } = useTranslation('storage');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const initialMetadata = JSON.stringify(file.metadata ?? {}, null, 2);
  const [name, setName] = useState(file.name);
  const [metadata, setMetadata] = useState(initialMetadata);
  const parsed = parseMetadata(metadata);
  const changed = name.trim() !== file.name || metadata !== initialMetadata;

  const save = useMutation({
    mutationFn: () =>
      filesApi.update(
        productId,
        tenantId,
        file.id,
        {
          ...(name.trim() !== file.name ? { name: name.trim() } : {}),
          ...(metadata !== initialMetadata && parsed.ok ? { metadata: parsed.value ?? {} } : {}),
        },
        file.version,
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.file(productId, tenantId, file.id), updated);
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'files', tenantId] });
      toast.success(t('edit.saved'));
      onDone();
    },
    onError: showError,
  });
  const fields = save.error ? fieldErrors(save.error) : {};

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (changed && parsed.ok && name.trim()) save.mutate();
  };

  return (
    <form className={layout.form} onSubmit={submit} aria-label={t('edit.title')}>
      <FormField label={t('fields.name')} required error={fields.name}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={1000}
          autoComplete="off"
        />
      </FormField>
      <FormField
        label={t('fields.metadata')}
        help={t('upload.metadataHelp')}
        error={parsed.ok ? fields.metadata : t(`upload.metadataError.${parsed.reason}`)}
      >
        <Textarea
          mono
          rows={5}
          value={metadata}
          onChange={(event) => setMetadata(event.target.value)}
          spellCheck={false}
        />
      </FormField>
      <div className={layout.actions}>
        <Button variant="ghost" onClick={onDone}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={save.isPending}
          disabled={!changed || !parsed.ok || !name.trim()}
        >
          {t('common:actions.save')}
        </Button>
      </div>
    </form>
  );
}
