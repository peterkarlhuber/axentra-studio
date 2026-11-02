import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toApiError, type ApiError } from '@/api/errors';
import type { FileInfo, TenantStorageUsage } from '@/api/models';
import { uploadFile, type UploadProgress } from '@/api/upload';
import { Alert, Button, Dialog, FormField, Input, Textarea, layout } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import {
  contentTypeAllowed,
  formatBytes,
  localDateTimeToIso,
  parseMetadata,
  type StorageLimits,
} from './storage-utils';
import styles from './storage.module.css';

export function UploadDialog({
  productId,
  tenantId,
  limits,
  usage,
  onClose,
  onUploaded,
}: {
  productId: string;
  tenantId: string;
  /** From `GET /v1/settings` when the principal may read it; the server enforces regardless. */
  limits: StorageLimits | undefined;
  usage: TenantStorageUsage | undefined;
  onClose: () => void;
  onUploaded: (file: FileInfo) => void;
}) {
  const { t } = useTranslation('storage');
  const format = useFormatters();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [metadata, setMetadata] = useState('');
  const [expires, setExpires] = useState('');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const abort = useRef<AbortController | null>(null);
  const busy = progress !== null;

  const bytes = (value: number) => formatBytes(value, format.locale);
  const parsedMetadata = parseMetadata(metadata);
  const tooLarge =
    file !== null && limits?.maxFileBytes !== undefined && file.size > limits.maxFileBytes;
  const typeNotAllowed =
    file !== null &&
    Boolean(file.type) &&
    !contentTypeAllowed(file.type, limits?.allowedContentTypes ?? []);
  const remaining =
    usage && usage.quota_bytes !== null ? usage.quota_bytes - usage.bytes_used : null;
  const overQuota = file !== null && remaining !== null && file.size > remaining;
  const filesFull =
    usage !== undefined && usage.quota_files !== null && usage.files_used >= usage.quota_files;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || tooLarge || !parsedMetadata.ok || busy) return;
    setError(null);
    abort.current = new AbortController();
    setProgress({ loaded: 0, total: file.size });
    try {
      const uploaded = await uploadFile(
        productId,
        tenantId,
        {
          file,
          name: name.trim() || undefined,
          metadata: parsedMetadata.value,
          expiresAt: localDateTimeToIso(expires),
        },
        { onProgress: setProgress, signal: abort.current.signal },
      );
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'files', tenantId] });
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'storage'] });
      onUploaded(uploaded);
    } catch (raw) {
      const apiError = toApiError(raw);
      if (apiError.code !== 'aborted') setError(apiError);
    } finally {
      abort.current = null;
      setProgress(null);
    }
  };

  const close = () => {
    abort.current?.abort();
    onClose();
  };

  const percent =
    progress && progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;
  const metadataError = parsedMetadata.ok
    ? undefined
    : t(`upload.metadataError.${parsedMetadata.reason}`);

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : close())}
      size="lg"
      title={t('upload.title')}
      description={t('upload.description')}
      dismissible={!busy}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {busy ? t('upload.cancelUpload') : t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="upload-form"
            variant="primary"
            loading={busy}
            disabled={!file || tooLarge || !parsedMetadata.ok}
          >
            {t('upload.submit')}
          </Button>
        </>
      }
    >
      <form id="upload-form" className={layout.form} onSubmit={(event) => void submit(event)}>
        <FormField
          label={t('upload.file')}
          required
          help={
            limits?.maxFileBytes !== undefined
              ? t('upload.maxSize', { size: bytes(limits.maxFileBytes) })
              : t('upload.maxSizeUnknown')
          }
          error={
            tooLarge && limits?.maxFileBytes !== undefined
              ? t('upload.tooLarge', { size: bytes(limits.maxFileBytes) })
              : undefined
          }
        >
          {/* The submit button stays disabled until a file is chosen; no native `required`. */}
          <Input
            type="file"
            required={false}
            aria-required="true"
            disabled={busy}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </FormField>
        {file ? (
          <p className={layout.muted}>
            {t('upload.selected', {
              name: file.name,
              size: bytes(file.size),
              type: file.type || t('upload.typeUnknown'),
            })}
          </p>
        ) : null}
        <TypePolicy limits={limits} />
        {typeNotAllowed ? <Alert tone="warning">{t('upload.typeNotAllowed')}</Alert> : null}
        {overQuota || filesFull ? <Alert tone="warning">{t('upload.quotaWarning')}</Alert> : null}
        <FormField label={t('upload.name')} help={t('upload.nameHelp')}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={busy}
            autoComplete="off"
            maxLength={1000}
          />
        </FormField>
        <FormField
          label={t('upload.metadata')}
          help={t('upload.metadataHelp')}
          error={metadataError}
        >
          <Textarea
            mono
            rows={3}
            value={metadata}
            onChange={(event) => setMetadata(event.target.value)}
            disabled={busy}
            spellCheck={false}
            placeholder='{"kind": "invoice"}'
          />
        </FormField>
        <FormField label={t('upload.expires')} help={t('upload.expiresHelp')}>
          <Input
            type="datetime-local"
            value={expires}
            onChange={(event) => setExpires(event.target.value)}
            disabled={busy}
          />
        </FormField>
        {progress ? (
          <div className={styles.progress}>
            <label htmlFor="upload-progress" className={styles.progressLabel}>
              {t('upload.progress', {
                percent,
                loaded: bytes(progress.loaded),
                total: bytes(progress.total),
              })}
            </label>
            <progress id="upload-progress" max={100} value={percent} />
          </div>
        ) : null}
        {error ? <UploadError error={error} /> : null}
      </form>
    </Dialog>
  );
}

function TypePolicy({ limits }: { limits: StorageLimits | undefined }) {
  const { t } = useTranslation('storage');
  if (!limits) return <p className={layout.muted}>{t('upload.policyUnknown')}</p>;
  return (
    <ul className={styles.policy}>
      <li>
        {limits.allowedContentTypes.length > 0
          ? t('upload.allowedTypes', { types: limits.allowedContentTypes.join(', ') })
          : t('upload.allTypes')}
      </li>
      <li>{limits.storeBlockedAsInert ? t('upload.blockedInert') : t('upload.blockedRefused')}</li>
    </ul>
  );
}

/** Upload failures, explained by code (413 size, 415 blocked type, 429 quota). */
function UploadError({ error }: { error: ApiError }) {
  const { t } = useTranslation('storage');
  const described = describeError(t, error);
  const specific = ['payload_too_large', 'unsupported_media_type', 'quota_exceeded'].includes(
    error.code,
  );
  return (
    <Alert tone="danger" title={specific ? t(`upload.errors.${error.code}`) : described.title}>
      <p>{specific ? t(`upload.errors.${error.code}Body`) : described.message}</p>
      {error.detail ? (
        <p>
          {t('errors:serverMessage')}: {error.detail}
        </p>
      ) : null}
      {described.requestId ? (
        <p>
          {t('errors:requestId')}: <code>{described.requestId}</code>
        </p>
      ) : null}
    </Alert>
  );
}
