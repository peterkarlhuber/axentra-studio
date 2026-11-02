import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Braces, Database, Eye, FolderTree, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { asItems, recordsApi, recordsWriteApi, type RecordSort } from '@/api/endpoints';
import { useCan, useErrorToast } from '@/app/auth';
import type { DataRecord } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useProductScope } from '@/app/contexts';
import {
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
  Input,
  JsonView,
  PageHeader,
  Skeleton,
  Time,
  layout,
  toSortParam,
  useToast,
  type Column,
  type SortState,
} from '@/components/ui';
import clsx from '@/lib/clsx';
import { useFormatters } from '@/lib/format';
import { useCursorList } from '@/lib/useCursorList';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { RecordEditorDialog } from './RecordEditorDialog';
import { parseFilterValue, previewData } from './records-utils';
import styles from './records.module.css';

export function RecordsPage() {
  const { t } = useTranslation('records');
  const { productId } = useProductScope();
  const format = useFormatters();
  const [params, setParams] = useSearchParams();
  const tenantId = params.get('tenant') ?? '';
  const collection = params.get('collection') ?? '';
  const can = useCan();
  const canWrite = tenantId ? can('records:write', { tenantId }) : false;
  const [creating, setCreating] = useState(false);
  const collections = useQuery({
    queryKey: queryKeys.collections(productId),
    queryFn: () => recordsApi.collections(productId),
  });

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

  const items = asItems(collections.data);

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('title')}
        description={canWrite ? t('descriptionWrite') : t('description')}
        actions={
          canWrite ? (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              {t('write.create')}
            </Button>
          ) : null
        }
      />
      {creating && tenantId ? (
        <RecordEditorDialog
          productId={productId}
          tenantId={tenantId}
          collection={collection}
          onClose={() => setCreating(false)}
          onSaved={(saved) => {
            setCreating(false);
            update({ collection: saved.collection });
          }}
        />
      ) : null}
      <div className={styles.layout}>
        <Card title={t('collections.title')} className={styles.sidebar}>
          {collections.isPending ? (
            <div className={layout.form} aria-busy="true">
              <Skeleton />
              <Skeleton width="80%" />
              <Skeleton width="60%" />
            </div>
          ) : collections.isError ? (
            <ErrorState
              error={collections.error}
              onRetry={() => void collections.refetch()}
              compact
              headingLevel={3}
            />
          ) : items.length === 0 ? (
            <EmptyState
              compact
              headingLevel={3}
              icon={<FolderTree />}
              title={t('collections.empty')}
              description={t('collections.emptyBody')}
            />
          ) : (
            <ul className={styles.collections}>
              {items.map((item) => (
                <li key={item.collection}>
                  <button
                    type="button"
                    className={clsx(
                      styles.collection,
                      item.collection === collection && styles.collectionActive,
                    )}
                    aria-pressed={item.collection === collection}
                    onClick={() => update({ collection: item.collection })}
                    title={t('collections.stats', { records: item.records, tenants: item.tenants })}
                  >
                    <Braces aria-hidden className={styles.collectionIcon} />
                    <span className={styles.collectionName}>{item.collection}</span>
                    <span className={styles.collectionCount}>
                      {format.number(item.records)}
                      <span className="ax-sr-only">
                        {' '}
                        {t('collections.stats', { records: item.records, tenants: item.tenants })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className={layout.stack}>
          <Card>
            <div className={layout.row}>
              <TenantPicker
                productId={productId}
                value={tenantId}
                onChange={(id) => update({ tenant: id })}
              />
            </div>
          </Card>
          {tenantId && collection ? (
            <RecordList
              key={`${tenantId}:${collection}`}
              productId={productId}
              tenantId={tenantId}
              collection={collection}
              canWrite={canWrite}
            />
          ) : (
            <Card>
              <EmptyState
                headingLevel={2}
                icon={<Database />}
                title={t('pick.title')}
                description={t('pick.body')}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordList({
  productId,
  tenantId,
  collection,
  canWrite,
}: {
  productId: string;
  tenantId: string;
  collection: string;
  canWrite: boolean;
}) {
  const { t } = useTranslation('records');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const [deleting, setDeleting] = useState<DataRecord | null>(null);
  const [sort, setSort] = useState<SortState | null>({ key: 'created_at', direction: 'desc' });
  const [field, setField] = useState('');
  const [value, setValue] = useState('');
  const [where, setWhere] = useState<Record<string, unknown>>({});
  const [selected, setSelected] = useState<DataRecord | null>(null);
  const query = { sort: toSortParam(sort) as RecordSort | undefined, where };
  const { tableProps } = useCursorList(
    queryKeys.records(productId, tenantId, collection, query),
    (cursor) => recordsApi.list(productId, tenantId, collection, { ...query, cursor }),
  );

  const applyFilter = (event: FormEvent) => {
    event.preventDefault();
    if (!field.trim()) return;
    setWhere((current) => ({ ...current, [field.trim()]: parseFilterValue(value) }));
    setField('');
    setValue('');
  };

  const columns: Column<DataRecord>[] = [
    {
      id: 'id',
      header: t('fields.id'),
      sortKey: 'id',
      rowHeader: true,
      cell: (record) => <code className={layout.mono}>{record.id}</code>,
    },
    {
      id: 'data',
      header: t('fields.data'),
      cell: (record) => <code className={styles.preview}>{previewData(record.data)}</code>,
    },
    {
      id: 'version',
      header: t('fields.version'),
      hideOnMobile: true,
      align: 'end',
      cell: (record) => record.version ?? '',
    },
    {
      id: 'created',
      header: t('fields.created'),
      sortKey: 'created_at',
      hideOnMobile: true,
      cell: (record) => <Time value={record.created_at} />,
    },
    {
      id: 'updated',
      header: t('fields.updated'),
      sortKey: 'updated_at',
      cell: (record) => <Time value={record.updated_at} />,
    },
    {
      id: 'view',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (record) => (
        <IconButton
          size="sm"
          icon={<Eye />}
          label={t('viewRecord', { id: record.id })}
          onClick={() => setSelected(record)}
        />
      ),
    },
  ];

  return (
    <Card flush title={collection} description={t('listDescription')}>
      <form className={layout.toolbar} onSubmit={applyFilter} aria-label={t('filter.label')}>
        <FormField label={t('filter.field')}>
          <Input
            value={field}
            onChange={(event) => setField(event.target.value)}
            spellCheck={false}
            placeholder="status"
          />
        </FormField>
        <FormField label={t('filter.value')} help={t('filter.valueHelp')}>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            spellCheck={false}
          />
        </FormField>
        <Button type="submit" disabled={!field.trim()}>
          {t('filter.add')}
        </Button>
      </form>
      {Object.keys(where).length > 0 ? (
        <ul className={styles.filters} aria-label={t('filter.active')}>
          {Object.entries(where).map(([key, filterValue]) => (
            <li key={key} className={styles.filterChip}>
              <code>
                {key} = {JSON.stringify(filterValue)}
              </code>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={t('filter.remove', { field: key })}
                onClick={() =>
                  setWhere((current) =>
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
        caption={t('tableCaption', { collection })}
        columns={columns}
        getRowId={(record) => record.id}
        sort={sort}
        onSortChange={setSort}
        selectedRowId={selected?.id}
        empty={<EmptyState compact headingLevel={3} icon={<Database />} title={t('empty')} />}
        {...tableProps}
      />
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => (open ? undefined : setSelected(null))}
        variant="drawer"
        title={t('record.title')}
        description={selected?.id}
      >
        {selected ? (
          <div className={layout.form}>
            {canWrite ? (
              <div className={layout.actions}>
                <Button icon={<Pencil />} onClick={() => setEditing(selected)}>
                  {t('write.edit')}
                </Button>
                <Button variant="danger" icon={<Trash2 />} onClick={() => setDeleting(selected)}>
                  {t('write.delete')}
                </Button>
              </div>
            ) : null}
            <DetailList
              items={[
                { label: t('fields.id'), value: selected.id, mono: true },
                { label: t('fields.collection'), value: selected.collection, mono: true },
                { label: t('fields.tenant'), value: selected.tenant_id, mono: true },
                { label: t('fields.version'), value: selected.version },
                {
                  label: t('fields.created'),
                  value: <Time value={selected.created_at} mode="absolute" />,
                },
                {
                  label: t('fields.updated'),
                  value: <Time value={selected.updated_at} mode="absolute" />,
                },
                { label: t('fields.createdBy'), value: selected.created_by, mono: true },
                { label: t('fields.updatedBy'), value: selected.updated_by, mono: true },
              ]}
            />
            <JsonView value={selected.data} label={t('fields.data')} />
          </div>
        ) : null}
      </Dialog>
      {editing ? (
        <RecordEditorDialog
          productId={productId}
          tenantId={tenantId}
          collection={collection}
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            setSelected(saved);
          }}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title={t('write.deleteTitle')}
        description={t('write.deleteBody', { id: deleting?.id })}
        confirmLabel={t('write.delete')}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await recordsWriteApi.remove(
              productId,
              tenantId,
              deleting.collection,
              deleting.id,
              deleting.version,
            );
            toast.success(t('write.deleted', { id: deleting.id }));
            setSelected(null);
            void queryClient.invalidateQueries({ queryKey: ['products', productId, 'records'] });
            void queryClient.invalidateQueries({ queryKey: queryKeys.collections(productId) });
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </Card>
  );
}
