import { useQuery } from '@tanstack/react-query';
import { ChevronDown, FileClock, FilterX, PanelRightOpen, Search } from 'lucide-react';
import { Fragment, useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { auditApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import type { AuditEvent } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useLastProductId } from '@/app/useLastProduct';
import { useSwitchableProducts } from '@/app/useProducts';
import {
  Alert,
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
  JsonView,
  PageHeader,
  Select,
  Skeleton,
  StatusPill,
  Time,
  layout,
  type Column,
} from '@/components/ui';
import { useCursorList } from '@/lib/useCursorList';
import { actorLabel, eventTime, localToRfc3339 } from './audit-utils';
import styles from './audit.module.css';

const FILTER_KEYS = [
  'product_id',
  'tenant_id',
  'action',
  'actor_id',
  'outcome',
  'since',
  'until',
  'q',
] as const;
const OUTCOMES = ['success', 'denied', 'failure'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
type Filters = Record<FilterKey, string>;

export function AuditPage() {
  const { t } = useTranslation('audit');
  const can = useCan();
  // Installation-wide audit needs `platform:audit`; otherwise events are product-scoped.
  const isAdmin = can('platform:audit');
  const lastProductId = useLastProductId();
  const { products } = useSwitchableProducts();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  // Non-admins are always scoped to a product; default to the current one.
  const applied: Filters = Object.fromEntries(
    FILTER_KEYS.map((key) => [
      key,
      params.get(key) ?? (key === 'product_id' && !isAdmin ? (lastProductId ?? '') : ''),
    ]),
  ) as Filters;
  const [draft, setDraft] = useState<Filters>(applied);

  const apiParams = {
    ...applied,
    outcome: (OUTCOMES as readonly string[]).includes(applied.outcome)
      ? (applied.outcome as (typeof OUTCOMES)[number])
      : '',
    since: localToRfc3339(applied.since),
    until: localToRfc3339(applied.until),
  } as const;
  const { tableProps } = useCursorList(queryKeys.audit(apiParams), (cursor) =>
    auditApi.list({ ...apiParams, cursor }),
  );
  const activeCount = FILTER_KEYS.filter((key) => applied[key]).length;

  const apply = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    FILTER_KEYS.forEach((key) => (draft[key] ? next.set(key, draft[key].trim()) : undefined));
    setParams(next, { replace: true });
  };
  const reset = () => {
    const cleared = Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])) as Filters;
    setDraft(cleared);
    setParams(new URLSearchParams(), { replace: true });
  };
  const set = (key: FilterKey) => (event: { target: { value: string } }) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }));

  // On narrow screens only the search field is shown until "More filters" is opened.
  const [showAllFilters, setShowAllFilters] = useState(false);
  const advancedId = useId();

  const columns: Column<AuditEvent>[] = [
    { id: 'time', header: t('fields.time'), cell: (event) => <Time value={eventTime(event)} /> },
    {
      id: 'action',
      header: t('fields.action'),
      rowHeader: true,
      cell: (event) => <ActionCode action={event.action} />,
      // Wraps only at the <wbr> after each dot.
    },
    {
      id: 'actor',
      header: t('fields.actor'),
      hideOnMobile: true,
      cell: (event) => (
        <span className={styles.actor} title={actorLabel(event)}>
          {actorLabel(event)}
        </span>
      ),
    },
    {
      id: 'target',
      header: t('fields.target'),
      hideOnMobile: true,
      cell: (event) =>
        event.target_type || event.target_id ? (
          <span className={layout.cellStack}>
            <span>{event.target_type}</span>
            <code className={layout.mono}>{event.target_id}</code>
          </span>
        ) : null,
    },
    {
      id: 'outcome',
      header: t('fields.outcome'),
      hideOnMobile: true,
      cell: (event) => <StatusPill status={event.outcome} />,
    },
    {
      id: 'details',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (event) => (
        <IconButton
          size="sm"
          icon={<PanelRightOpen />}
          label={t('openDetails', { action: event.action })}
          onClick={() => setSelected(event)}
        />
      ),
    },
  ];

  return (
    <div className={layout.stack}>
      <PageHeader title={t('title')} description={t('description')} />
      <Card flush>
        <form className={styles.filters} onSubmit={apply} aria-label={t('filters.label')}>
          <FormField label={t('filters.search')}>
            <Input
              type="search"
              value={draft.q}
              onChange={set('q')}
              placeholder={t('filters.searchPlaceholder')}
            />
          </FormField>
          <button
            type="button"
            className={styles.moreToggle}
            aria-expanded={showAllFilters}
            aria-controls={advancedId}
            onClick={() => setShowAllFilters((value) => !value)}
          >
            {showAllFilters ? t('filters.fewer') : t('filters.more')}
            {activeCount > 0 ? ` (${activeCount})` : ''}
            <ChevronDown aria-hidden className={styles.moreIcon} />
          </button>
          <div id={advancedId} className={styles.advanced} data-open={showAllFilters}>
            <FormField label={t('filters.product')}>
              <Select value={draft.product_id} onChange={set('product_id')}>
                {isAdmin ? <option value="">{t('filters.allProducts')}</option> : null}
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t('filters.tenant')}>
              <Input
                value={draft.tenant_id}
                onChange={set('tenant_id')}
                placeholder="ten_…"
                spellCheck={false}
              />
            </FormField>
            <FormField label={t('filters.action')}>
              <Input
                value={draft.action}
                onChange={set('action')}
                placeholder="tenant.created"
                spellCheck={false}
              />
            </FormField>
            <FormField label={t('filters.actor')}>
              <Input
                value={draft.actor_id}
                onChange={set('actor_id')}
                placeholder="usr_…"
                spellCheck={false}
              />
            </FormField>
            <FormField label={t('fields.outcome')}>
              <Select value={draft.outcome} onChange={set('outcome')}>
                <option value="">{t('filters.allOutcomes')}</option>
                {OUTCOMES.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {t(`common:status.${outcome}`)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t('filters.since')}>
              <Input type="datetime-local" value={draft.since} onChange={set('since')} />
            </FormField>
            <FormField label={t('filters.until')}>
              <Input type="datetime-local" value={draft.until} onChange={set('until')} />
            </FormField>
          </div>
          <div className={styles.filterActions}>
            <Button type="submit" variant="primary" icon={<Search />}>
              {t('filters.apply')}
            </Button>
            {activeCount > 0 ? (
              <Button variant="ghost" icon={<FilterX />} onClick={reset}>
                {t('filters.reset')}
              </Button>
            ) : null}
          </div>
        </form>
        <DataTable
          caption={t('title')}
          columns={columns}
          getRowId={(event) => event.id}
          selectedRowId={selected?.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<FileClock />}
              title={activeCount ? t('empty.filteredTitle') : t('empty.title')}
              description={activeCount ? t('empty.filteredBody') : t('empty.body')}
            />
          }
          {...tableProps}
        />
      </Card>
      <AuditDetail event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AuditDetail({ event, onClose }: { event: AuditEvent | null; onClose: () => void }) {
  const { t } = useTranslation('audit');
  const detail = useQuery({
    queryKey: queryKeys.auditEvent(event?.id ?? ''),
    queryFn: () => auditApi.get(event?.id ?? ''),
    enabled: Boolean(event),
    placeholderData: event ?? undefined,
  });
  // `404` (not `403`) for an event the caller may not read, so the endpoint reveals nothing;
  // the list row is still shown, with a note that no further details are available.
  const notFound = isApiError(detail.error) && detail.error.isNotFound;
  const data = detail.data ?? (notFound ? (event ?? undefined) : undefined);

  return (
    <Dialog
      open={event !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      variant="drawer"
      title={event?.action ?? ''}
      description={t('detail.subtitle')}
    >
      {detail.isError && !notFound ? (
        <ErrorState
          error={detail.error}
          onRetry={() => void detail.refetch()}
          compact
          headingLevel={3}
        />
      ) : data ? (
        <div className={layout.form}>
          {notFound ? <Alert tone="info">{t('detail.notFound')}</Alert> : null}
          <DetailList
            items={[
              { label: t('fields.id'), value: data.id, mono: true },
              { label: t('fields.time'), value: <Time value={eventTime(data)} mode="absolute" /> },
              { label: t('fields.action'), value: data.action, mono: true },
              { label: t('fields.actor'), value: actorLabel(data) },
              { label: t('fields.actorType'), value: <Badge>{data.actor_kind}</Badge> },
              { label: t('fields.actorId'), value: data.actor_id, mono: true },
              { label: t('fields.product'), value: data.product_id, mono: true },
              { label: t('fields.tenant'), value: data.tenant_id, mono: true },
              {
                label: t('fields.target'),
                value: [data.target_type, data.target_id].filter(Boolean).join(' · '),
                mono: true,
              },
              { label: t('fields.outcome'), value: <StatusPill status={data.outcome} /> },
              { label: t('fields.requestId'), value: data.request_id, mono: true },
              { label: t('fields.ip'), value: data.ip, mono: true },
            ]}
          />
          {detail.isFetching && detail.isPlaceholderData ? <Skeleton height={80} /> : null}
          <h3 className={styles.sectionTitle}>{t('detail.details')}</h3>
          {Object.keys(data.details ?? {}).length > 0 ? (
            <JsonView value={data.details} label={t('detail.details')} />
          ) : (
            <p className={layout.muted}>{t('detail.noDetails')}</p>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}

/** Dotted action names may wrap after each dot, never in the middle of a word. */
function ActionCode({ action }: { action: string }) {
  const parts = action.split('.');
  return (
    <code className={styles.action}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? '.' : null}
          {index > 0 ? <wbr /> : null}
          {part}
        </Fragment>
      ))}
    </code>
  );
}
