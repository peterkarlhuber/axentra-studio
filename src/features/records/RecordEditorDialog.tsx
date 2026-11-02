import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { recordsWriteApi } from '@/api/endpoints';
import type { DataRecord } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import { Button, Dialog, FormField, Input, Textarea, layout, useToast } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { parseRecordData, validCollectionName } from './records-utils';

/**
 * Create a record (any collection; a new name creates the collection) or replace the data of
 * an existing one. Replace sends `If-Match` with the record version, so a concurrent change
 * is reported as 412 instead of being overwritten.
 */
export function RecordEditorDialog({
  productId,
  tenantId,
  collection,
  record,
  onClose,
  onSaved,
}: {
  productId: string;
  tenantId: string;
  /** Preset collection for new records; ignored when editing. */
  collection: string;
  record?: DataRecord;
  onClose: () => void;
  onSaved: (record: DataRecord) => void;
}) {
  const { t } = useTranslation('records');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const initialData = JSON.stringify(record?.data ?? {}, null, 2);
  const [name, setName] = useState(record?.collection ?? collection);
  const [data, setData] = useState(initialData);
  const parsed = parseRecordData(data);
  const nameOk = validCollectionName(name.trim());
  const changed = record ? data !== initialData : true;

  const save = useMutation({
    mutationFn: () => {
      const value = parsed.ok ? parsed.value : {};
      return record
        ? recordsWriteApi.replace(
            productId,
            tenantId,
            record.collection,
            record.id,
            value,
            record.version,
          )
        : recordsWriteApi.create(productId, tenantId, name.trim(), value);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'records'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.collections(productId) });
      toast.success(
        record ? t('write.updated', { id: saved.id }) : t('write.created', { id: saved.id }),
      );
      onSaved(saved);
    },
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (parsed.ok && nameOk && changed) save.mutate();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={record ? t('write.editTitle') : t('write.createTitle')}
      description={record ? record.id : t('write.createDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="record-form"
            variant="primary"
            loading={save.isPending}
            disabled={!parsed.ok || !nameOk || !changed}
          >
            {record ? t('common:actions.save') : t('write.createSubmit')}
          </Button>
        </>
      }
    >
      <form id="record-form" className={layout.form} onSubmit={submit}>
        <FormField
          label={t('fields.collection')}
          required
          help={t('write.collectionHelp')}
          info={t('write.collectionInfo')}
          infoTopic="records#collections"
          error={name.trim() && !nameOk ? t('write.collectionInvalid') : undefined}
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            readOnly={Boolean(record)}
            spellCheck={false}
            autoComplete="off"
          />
        </FormField>
        <FormField
          label={t('fields.data')}
          required
          help={t('write.dataHelp')}
          info={t('write.dataInfo')}
          infoTopic="records#edit"
          error={parsed.ok ? undefined : t(`write.dataError.${parsed.reason}`)}
        >
          <Textarea
            mono
            rows={12}
            value={data}
            onChange={(event) => setData(event.target.value)}
            spellCheck={false}
          />
        </FormField>
        {record ? (
          <p className={layout.muted}>
            {t('write.versionNote', { version: record.version })}{' '}
            <HelpLink topic="records#versions">{t('write.conflictLink')}</HelpLink>
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
