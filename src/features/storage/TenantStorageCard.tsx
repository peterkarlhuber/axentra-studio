import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { storageApi } from '@/api/endpoints';
import type { TenantStorageUsage } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import {
  Alert,
  Button,
  Card,
  Dialog,
  ErrorState,
  FormField,
  Input,
  Select,
  Skeleton,
  layout,
  useToast,
} from '@/components/ui';
import { useFormatters } from '@/lib/format';
import {
  formatBytes,
  parseQuotaAmount,
  QUOTA_UNITS,
  splitBytes,
  usagePercent,
  type QuotaUnit,
} from './storage-utils';
import styles from './storage.module.css';

/** One usage line: "12 MiB of 1 GiB", a meter and whether the quota is inherited. */
export function UsageMeter({
  label,
  used,
  quota,
  override,
  format,
}: {
  label: string;
  used: number;
  quota: number | null;
  override: number | null;
  format: (value: number) => string;
}) {
  const { t } = useTranslation('storage');
  const percent = usagePercent(used, quota);
  const value =
    quota === null
      ? t('usage.usedUnlimited', { used: format(used) })
      : t('usage.usedOf', { used: format(used), quota: format(quota) });
  return (
    <div className={styles.meter}>
      <div className={styles.meterHead}>
        <span className={styles.meterLabel}>{label}</span>
        <span className={styles.meterValue}>{value}</span>
      </div>
      {percent !== null ? (
        <meter
          className={styles.meterBar}
          min={0}
          max={100}
          low={80}
          high={95}
          optimum={0}
          value={Math.min(percent, 100)}
          aria-label={t('usage.meterLabel', { label, percent })}
        />
      ) : null}
      <span className={layout.muted}>
        {quota === null
          ? t('usage.noQuota')
          : override === null
            ? t('usage.inherited')
            : t('usage.override')}
        {percent !== null ? ` · ${t('usage.percent', { percent })}` : null}
      </span>
    </div>
  );
}

export function TenantStorageCard({
  productId,
  tenantId,
  canEditQuota,
}: {
  productId: string;
  tenantId: string;
  canEditQuota: boolean;
}) {
  const { t } = useTranslation('storage');
  const format = useFormatters();
  const [editing, setEditing] = useState(false);
  const usage = useQuery({
    queryKey: queryKeys.tenantStorage(productId, tenantId),
    queryFn: () => storageApi.tenantUsage(productId, tenantId),
  });
  const bytes = (value: number) => formatBytes(value, format.locale);

  return (
    <Card
      title={t('usage.title')}
      description={t('usage.description')}
      headingLevel={2}
      actions={
        canEditQuota && usage.data ? (
          <Button size="sm" icon={<Pencil />} onClick={() => setEditing(true)}>
            {t('quota.edit')}
          </Button>
        ) : null
      }
    >
      {usage.isPending ? (
        <div className={layout.form} aria-busy="true">
          <Skeleton />
          <Skeleton width="70%" />
        </div>
      ) : usage.isError ? (
        <ErrorState
          error={usage.error}
          onRetry={() => void usage.refetch()}
          compact
          headingLevel={3}
        />
      ) : (
        <div className={styles.meters}>
          <UsageMeter
            label={t('usage.bytes')}
            used={usage.data.bytes_used}
            quota={usage.data.quota_bytes}
            override={usage.data.quota_bytes_override}
            format={bytes}
          />
          <UsageMeter
            label={t('usage.files')}
            used={usage.data.files_used}
            quota={usage.data.quota_files}
            override={usage.data.quota_files_override}
            format={format.number}
          />
        </div>
      )}
      {editing && usage.data ? (
        <QuotaDialog
          productId={productId}
          tenantId={tenantId}
          usage={usage.data}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </Card>
  );
}

function QuotaDialog({
  productId,
  tenantId,
  usage,
  onClose,
}: {
  productId: string;
  tenantId: string;
  usage: TenantStorageUsage;
  onClose: () => void;
}) {
  const { t } = useTranslation('storage');
  const format = useFormatters();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const initialBytes = splitBytes(usage.quota_bytes_override);
  const [bytesAmount, setBytesAmount] = useState(initialBytes.amount);
  const [unit, setUnit] = useState<QuotaUnit>(initialBytes.unit);
  const [files, setFiles] = useState(
    usage.quota_files_override === null ? '' : String(usage.quota_files_override),
  );
  const quotaBytes = parseQuotaAmount(bytesAmount, QUOTA_UNITS[unit]);
  const quotaFiles = parseQuotaAmount(files);
  const invalid = quotaBytes === 'invalid' || quotaFiles === 'invalid';

  const save = useMutation({
    mutationFn: () =>
      storageApi.setQuota(
        productId,
        tenantId,
        {
          quota_bytes: quotaBytes === 'invalid' ? null : quotaBytes,
          quota_files: quotaFiles === 'invalid' ? null : quotaFiles,
        },
        usage.quota_version,
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tenantStorage(productId, tenantId), updated);
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'storage'] });
      toast.success(t('quota.saved'));
      onClose();
    },
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!invalid) save.mutate();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t('quota.title')}
      description={t('quota.description')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="quota-form"
            variant="primary"
            loading={save.isPending}
            disabled={invalid}
          >
            {t('common:actions.save')}
          </Button>
        </>
      }
    >
      <form id="quota-form" className={layout.form} onSubmit={submit}>
        <div className={styles.quotaRow}>
          <FormField
            label={t('quota.bytes')}
            help={t('quota.inheritHelp')}
            error={quotaBytes === 'invalid' ? t('quota.invalid') : undefined}
          >
            <Input
              inputMode="decimal"
              value={bytesAmount}
              onChange={(event) => setBytesAmount(event.target.value)}
              autoComplete="off"
            />
          </FormField>
          <FormField label={t('quota.unit')}>
            <Select value={unit} onChange={(event) => setUnit(event.target.value as QuotaUnit)}>
              {(Object.keys(QUOTA_UNITS) as QuotaUnit[]).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField
          label={t('quota.files')}
          help={t('quota.inheritHelp')}
          error={quotaFiles === 'invalid' ? t('quota.invalid') : undefined}
        >
          <Input
            inputMode="numeric"
            value={files}
            onChange={(event) => setFiles(event.target.value)}
            autoComplete="off"
          />
        </FormField>
        <p className={layout.muted}>
          {t('quota.current', {
            bytes: formatBytes(usage.bytes_used, format.locale),
            files: format.number(usage.files_used),
          })}
        </p>
        {typeof quotaBytes === 'number' && quotaBytes < usage.bytes_used ? (
          <Alert tone="warning">{t('quota.belowUsage')}</Alert>
        ) : null}
        <p className={layout.muted}>{t('quota.effectiveNote')}</p>
      </form>
    </Dialog>
  );
}
