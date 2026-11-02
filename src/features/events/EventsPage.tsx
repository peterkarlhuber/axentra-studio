import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eraser, FilterX, PanelRightOpen, Pause, Play, Radio, Search, Send } from 'lucide-react';
import { useCallback, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { eventsApi } from '@/api/endpoints';
import { isIdempotencyConflict } from '@/api/errors';
import type { DomainEvent } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import { canInAnyTenant } from '@/app/permissions';
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
  Tabs,
  Textarea,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { useCursorList } from '@/lib/useCursorList';
import { TenantPicker } from '@/features/shared/TenantPicker';
import type { StreamMessage } from './event-stream';
import {
  EVENT_PATTERN,
  kindProblem,
  newIdempotencyKey,
  parseJsonObject,
  splitPatterns,
} from './events-utils';
import { FormError } from './shared';
import { StreamIndicator } from './StreamIndicator';
import { useEventStream } from './useEventStream';
import styles from './events.module.css';

/** Messages kept in the live view; older ones drop off (the event log has them all). */
const LIVE_LIMIT = 200;

export function EventsPage() {
  const { t } = useTranslation('events');
  const { productId, access } = useProductScope();
  const can = useCan();
  const canPublish = can('events:publish') || canInAnyTenant(access, 'events:publish');
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'live' ? 'live' : 'log';
  const [publishing, setPublishing] = useState(false);
  const queryClient = useQueryClient();

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('events.title')}
        description={t('events.description')}
        actions={
          canPublish ? (
            <Button variant="primary" icon={<Send />} onClick={() => setPublishing(true)}>
              {t('events.publish')}
            </Button>
          ) : null
        }
      />
      <Tabs
        label={t('events.views')}
        value={view}
        onValueChange={(value) =>
          setParams(
            (current) => {
              const next = new URLSearchParams(current);
              if (value === 'live') next.set('view', 'live');
              else next.delete('view');
              return next;
            },
            { replace: true },
          )
        }
        items={[
          { value: 'log', label: t('events.log'), content: <EventLog productId={productId} /> },
          { value: 'live', label: t('events.live'), content: <LiveEvents productId={productId} /> },
        ]}
      />
      {publishing ? (
        <PublishEventDialog
          productId={productId}
          onClose={() => setPublishing(false)}
          onPublished={() => {
            setPublishing(false);
            void queryClient.invalidateQueries({ queryKey: ['products', productId, 'events'] });
          }}
        />
      ) : null}
    </div>
  );
}

function EventLog({ productId }: { productId: string }) {
  const { t } = useTranslation('events');
  const [params, setParams] = useSearchParams();
  const applied = { type: params.get('type') ?? '', tenant_id: params.get('tenant') ?? '' };
  const [draft, setDraft] = useState(applied);
  const [selected, setSelected] = useState<DomainEvent | null>(null);
  const { tableProps } = useCursorList(queryKeys.events(productId, applied), (cursor) =>
    eventsApi.list(productId, { ...applied, cursor }),
  );
  const active = Object.values(applied).filter(Boolean).length;
  const typeIssue = draft.type.trim() && !isTypeFilter(draft.type.trim());

  const update = (values: typeof applied) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (values.type) next.set('type', values.type);
        else next.delete('type');
        if (values.tenant_id) next.set('tenant', values.tenant_id);
        else next.delete('tenant');
        return next;
      },
      { replace: true },
    );
  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (typeIssue) return;
    update({ type: draft.type.trim(), tenant_id: draft.tenant_id });
  };

  const columns: Column<DomainEvent>[] = [
    {
      id: 'type',
      header: t('events.type'),
      rowHeader: true,
      cell: (event) => <code className={styles.typeCode}>{event.type}</code>,
    },
    {
      id: 'tenant',
      header: t('jobs.tenant'),
      hideOnMobile: true,
      cell: (event) =>
        event.tenant_id ? (
          <code className={layout.mono}>{event.tenant_id}</code>
        ) : (
          <span className={layout.muted}>{t('jobs.productLevel')}</span>
        ),
    },
    {
      id: 'actor',
      header: t('events.actor'),
      hideOnMobile: true,
      cell: (event) => (
        <span className={layout.cellStack}>
          <Badge>{event.actor_kind}</Badge>
          <code className={layout.muted}>{event.actor_id}</code>
        </span>
      ),
    },
    {
      id: 'occurred',
      header: t('events.occurred'),
      cell: (event) => <Time value={event.occurred_at} />,
    },
    {
      id: 'details',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (event) => (
        <IconButton
          size="sm"
          icon={<PanelRightOpen />}
          label={t('events.openDetails', { type: event.type })}
          onClick={() => setSelected(event)}
        />
      ),
    },
  ];

  return (
    <Card flush>
      <form className={styles.filters} onSubmit={apply} aria-label={t('events.filters')}>
        <FormField
          label={t('events.type')}
          help={t('events.typeFilterHelp')}
          error={typeIssue ? t('validation.typeFilter') : undefined}
        >
          <Input
            value={draft.type}
            onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
            placeholder="invoice.*"
            spellCheck={false}
          />
        </FormField>
        <TenantPicker
          productId={productId}
          value={draft.tenant_id}
          onChange={(tenantId) => setDraft((current) => ({ ...current, tenant_id: tenantId }))}
          label={t('jobs.tenant')}
          allowNone
          noneLabel={t('jobs.allTenants')}
        />
        <div className={styles.filterActions}>
          <Button type="submit" variant="primary" icon={<Search />}>
            {t('filters.apply')}
          </Button>
          {active > 0 ? (
            <Button
              variant="ghost"
              icon={<FilterX />}
              onClick={() => {
                setDraft({ type: '', tenant_id: '' });
                update({ type: '', tenant_id: '' });
              }}
            >
              {t('filters.reset')}
            </Button>
          ) : null}
        </div>
      </form>
      <DataTable
        caption={t('events.log')}
        columns={columns}
        getRowId={(event) => event.id}
        selectedRowId={selected?.id}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Radio />}
            title={active ? t('events.emptyFiltered') : t('events.empty')}
            description={active ? undefined : t('events.emptyBody')}
          />
        }
        {...tableProps}
      />
      <EventDetail productId={productId} event={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}

/** `GET /events?type=` takes an exact type or a prefix ending in `*`. */
function isTypeFilter(value: string) {
  const base = value.endsWith('*') ? value.slice(0, -1) : value;
  return base === '' ? value === '*' : /^[a-z0-9_.:-]{1,150}$/.test(base);
}

function EventDetail({
  productId,
  event,
  onClose,
}: {
  productId: string;
  event: DomainEvent | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('events');
  const detail = useQuery({
    queryKey: queryKeys.event(productId, event?.id ?? ''),
    queryFn: () => eventsApi.get(productId, event?.id ?? ''),
    enabled: Boolean(event),
    placeholderData: event ?? undefined,
  });
  const data = detail.data;
  return (
    <Dialog
      open={event !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      variant="drawer"
      title={event?.type ?? ''}
      description={t('events.detailSubtitle')}
    >
      {detail.isError ? (
        <ErrorState
          error={detail.error}
          onRetry={() => void detail.refetch()}
          compact
          headingLevel={3}
        />
      ) : data ? (
        <div className={layout.form}>
          <EventFacts event={data} />
          <h3 className={styles.sectionTitle}>{t('events.data')}</h3>
          <JsonView value={data.data} label={t('events.data')} />
        </div>
      ) : null}
    </Dialog>
  );
}

function EventFacts({ event }: { event: DomainEvent }) {
  const { t } = useTranslation('events');
  return (
    <DetailList
      items={[
        { label: t('events.id'), value: event.id, mono: true },
        { label: t('events.type'), value: event.type, mono: true },
        { label: t('events.occurred'), value: <Time value={event.occurred_at} mode="absolute" /> },
        { label: t('jobs.tenant'), value: event.tenant_id ?? t('jobs.productLevel') },
        { label: t('events.actor'), value: `${event.actor_kind} · ${event.actor_id}` },
        { label: t('events.requestId'), value: event.request_id, mono: true },
        { label: t('jobs.idempotencyKey'), value: event.idempotency_key, mono: true },
      ]}
    />
  );
}

interface LiveEntry {
  key: string;
  position: string | null;
  type: string;
  event: Partial<DomainEvent> & Record<string, unknown>;
  receivedAt: string;
}

function LiveEvents({ productId }: { productId: string }) {
  const { t } = useTranslation('events');
  const [typesDraft, setTypesDraft] = useState('');
  const [types, setTypes] = useState('');
  const [connected, setConnected] = useState(true);
  const [paused, setPaused] = useState(false);
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [buffer, setBuffer] = useState<LiveEntry[]>([]);
  const patterns = splitPatterns(typesDraft);
  const typesIssue = patterns.some((pattern) => !EVENT_PATTERN.test(pattern));

  const url = connected ? eventsApi.streamUrl(productId, { types }) : null;
  const onMessage = useCallback(
    (message: StreamMessage) => {
      const event = (
        message.data && typeof message.data === 'object' ? message.data : {}
      ) as LiveEntry['event'];
      const entry: LiveEntry = {
        key: `${message.id ?? ''}:${String(event.id ?? Math.random())}`,
        position: message.id,
        type: message.event,
        event,
        receivedAt: new Date().toISOString(),
      };
      if (paused) setBuffer((current) => [entry, ...current].slice(0, LIVE_LIMIT));
      else setEntries((current) => [entry, ...current].slice(0, LIVE_LIMIT));
    },
    [paused],
  );
  const stream = useEventStream(url, onMessage);

  const resume = () => {
    setEntries((current) => [...buffer, ...current].slice(0, LIVE_LIMIT));
    setBuffer([]);
    setPaused(false);
  };

  return (
    <Card flush>
      <form
        className={styles.filters}
        aria-label={t('live.filters')}
        onSubmit={(event) => {
          event.preventDefault();
          if (typesIssue) return;
          setTypes(patterns.join(','));
          setEntries([]);
          setBuffer([]);
        }}
      >
        <FormField
          label={t('live.types')}
          help={t('live.typesHelp')}
          error={typesIssue ? t('validation.patterns') : undefined}
        >
          <Input
            value={typesDraft}
            onChange={(event) => setTypesDraft(event.target.value)}
            placeholder="invoice.*, user.created"
            spellCheck={false}
          />
        </FormField>
        <div className={styles.filterActions}>
          <Button type="submit" icon={<Search />}>
            {t('live.applyTypes')}
          </Button>
        </div>
      </form>
      <div className={styles.liveRow}>
        {connected ? (
          <StreamIndicator stream={stream} paused={paused} />
        ) : (
          <span className={styles.streamState} role="status">
            <span className={styles.streamDot} aria-hidden="true" />
            {t('stream.idle')}
          </span>
        )}
        <div className={layout.actions}>
          {connected ? (
            paused ? (
              <Button size="sm" icon={<Play />} onClick={resume}>
                {buffer.length > 0
                  ? t('live.resumeWith', { count: buffer.length })
                  : t('live.resume')}
              </Button>
            ) : (
              <Button size="sm" icon={<Pause />} onClick={() => setPaused(true)}>
                {t('live.pause')}
              </Button>
            )
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setConnected((value) => !value);
              setPaused(false);
              setBuffer([]);
            }}
          >
            {connected ? t('live.disconnect') : t('live.connect')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Eraser />}
            disabled={entries.length === 0}
            onClick={() => setEntries([])}
          >
            {t('live.clear')}
          </Button>
        </div>
      </div>
      <p className={styles.liveNote}>{t('live.note')}</p>
      {entries.length === 0 ? (
        <EmptyState
          compact
          headingLevel={3}
          icon={<Radio />}
          title={t('live.empty')}
          description={t('live.emptyBody')}
        />
      ) : (
        <ol className={styles.liveList} aria-label={t('live.received')}>
          {entries.map((entry) => (
            <li key={entry.key} className={styles.liveItem}>
              <div className={styles.liveHead}>
                <code className={styles.typeCode}>{entry.type}</code>
                <span className={layout.muted}>
                  {entry.event.tenant_id ? <code>{String(entry.event.tenant_id)}</code> : null}{' '}
                  <Time
                    value={
                      typeof entry.event.occurred_at === 'string'
                        ? entry.event.occurred_at
                        : entry.receivedAt
                    }
                  />
                </span>
              </div>
              <details className={styles.liveDetails}>
                <summary>{t('live.showData', { position: entry.position ?? '—' })}</summary>
                <JsonView
                  value={entry.event}
                  label={t('live.dataOf', { type: entry.type })}
                  maxHeight={260}
                />
              </details>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function PublishEventDialog({
  productId,
  onClose,
  onPublished,
}: {
  productId: string;
  onClose: () => void;
  onPublished: (event: DomainEvent) => void;
}) {
  const { t } = useTranslation('events');
  const toast = useToast();
  const [tenantId, setTenantId] = useState('');
  const [type, setType] = useState('');
  const [data, setData] = useState('{}');
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [conflict, setConflict] = useState(false);
  const parsed = parseJsonObject(data);
  const typeIssue = kindProblem(type);
  const publish = useMutation({
    mutationFn: () =>
      eventsApi.publish(
        productId,
        tenantId,
        {
          type: type.trim(),
          data: parsed.ok ? parsed.value : {},
        },
        idempotencyKey,
      ),
    onSuccess: (event) => {
      toast.success(t('events.published', { type: event.type }));
      onPublished(event);
    },
    onError: (error) => {
      // 409: an earlier attempt with other values used this dialog's key; the next submit is new.
      const renewed = isIdempotencyConflict(error);
      setConflict(renewed);
      if (renewed) setIdempotencyKey(newIdempotencyKey());
    },
  });
  const fields = publish.error ? fieldErrors(publish.error) : {};
  const invalid = !tenantId || !type.trim() || Boolean(typeIssue) || !parsed.ok;
  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t('events.publish')}
      description={t('events.publishDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="publish-form"
            variant="primary"
            loading={publish.isPending}
            disabled={invalid}
          >
            {t('events.publishSubmit')}
          </Button>
        </>
      }
    >
      <form
        id="publish-form"
        className={layout.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) publish.mutate();
        }}
      >
        {conflict ? (
          <Alert tone="warning" title={t('common:idempotency.conflictTitle')}>
            {t('common:idempotency.conflictRenewed')}
          </Alert>
        ) : (
          <FormError error={publish.error} />
        )}
        <TenantPicker
          productId={productId}
          value={tenantId}
          onChange={setTenantId}
          label={t('jobs.tenant')}
        />
        <FormField
          label={t('events.type')}
          help={t('events.typeHelp')}
          error={typeIssue ? t(`validation.type.${typeIssue}`) : fields.type}
          required
        >
          <Input
            value={type}
            onChange={(event) => setType(event.target.value)}
            placeholder="invoice.created"
            autoComplete="off"
            spellCheck={false}
          />
        </FormField>
        <FormField
          label={t('events.data')}
          error={parsed.ok ? fields.data : t('validation.jsonObject')}
        >
          <Textarea
            mono
            rows={5}
            value={data}
            onChange={(event) => setData(event.target.value)}
            spellCheck={false}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
