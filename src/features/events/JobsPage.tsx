import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  CalendarClock,
  FilterX,
  ListChecks,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { eventsApi, jobsApi, type JobListParams } from '@/api/endpoints';
import { isIdempotencyConflict } from '@/api/errors';
import type { Job, JobStats, JobStatus } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast, useMe } from '@/app/auth';
import { productAccess } from '@/app/permissions';
import { useProductScope } from '@/app/contexts';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  DataTable,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  Switch,
  Textarea,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { useFormatters } from '@/lib/format';
import { useCursorList } from '@/lib/useCursorList';
import { fieldErrors } from '@/lib/errors';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { HelpLink } from '@/help/HelpLink';
import { InfoTip } from '@/help/InfoTip';
import menuStyles from '@/components/ui/IconButton.module.css';
import {
  JOB_STATUSES,
  canCancelJob,
  canRetryJob,
  isSkippedJob,
  kindProblem,
  newIdempotencyKey,
  parseJsonObject,
} from './events-utils';
import { FormError, JobStatusPill } from './shared';
import { StreamIndicator } from './StreamIndicator';
import { useEventStream } from './useEventStream';
import styles from './events.module.css';

type JobAction = { action: 'retry' | 'cancel'; job: Job };

export function JobsPage() {
  const { t } = useTranslation('events');
  const { productId } = useProductScope();
  const can = useCan();
  const canManage = can('jobs:manage');
  const { data: me } = useMe();
  // Operators and tenant members without jobs:manage may enqueue the kinds opened to them with
  // an enqueue_permission (listed per tenant by GET .../jobs/kinds). `/v1/me` lists only the
  // tenants with a tenant role, so an operator counts through its product role.
  const access = productAccess(me, productId);
  const tenantCaller = !canManage && Boolean(access?.role || access?.tenants.length);
  const canEnqueue = canManage || tenantCaller;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const applied = {
    status: (JOB_STATUSES as string[]).includes(params.get('status') ?? '')
      ? (params.get('status') as JobStatus)
      : '',
    kind: params.get('kind') ?? '',
    tenant_id: params.get('tenant') ?? '',
  } satisfies JobListParams;
  const [draft, setDraft] = useState(applied);
  const [confirm, setConfirm] = useState<JobAction | null>(null);
  const [live, setLive] = useState(false);
  const creating = params.get('new') === '1' && canEnqueue;

  const stats = useQuery({
    queryKey: queryKeys.jobStats(productId),
    queryFn: () => jobsApi.stats(productId),
  });
  const { tableProps } = useCursorList(queryKeys.jobs(productId, applied), (cursor) =>
    jobsApi.list(productId, { ...applied, cursor }),
  );
  const activeFilters = Object.values(applied).filter(Boolean).length;

  // Live updates: the jobs stream reports status changes; refresh list and counters (at most
  // once a second) instead of patching rows, so filters and pagination stay correct.
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );
  const stream = useEventStream(live ? eventsApi.jobsStreamUrl(productId) : null, () => {
    if (refreshTimer.current) return;
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'jobs'] });
    }, 1000);
  });

  const setSearch = (update: (next: URLSearchParams) => void) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        update(next);
        return next;
      },
      { replace: true },
    );
  const apply = (event: FormEvent) => {
    event.preventDefault();
    setSearch((next) => {
      for (const [key, param] of [
        ['status', 'status'],
        ['kind', 'kind'],
        ['tenant_id', 'tenant'],
      ] as const) {
        const value = draft[key].trim();
        if (value) next.set(param, value);
        else next.delete(param);
      }
    });
  };
  const reset = () => {
    setDraft({ status: '', kind: '', tenant_id: '' });
    setSearch((next) => ['status', 'kind', 'tenant'].forEach((key) => next.delete(key)));
  };
  const filterStatus = (status: JobStatus) => {
    setDraft((current) => ({ ...current, status }));
    setSearch((next) => next.set('status', status));
  };
  const setCreating = (open: boolean) =>
    setSearch((next) => (open ? next.set('new', '1') : next.delete('new')));

  const columns: Column<Job>[] = [
    {
      id: 'kind',
      header: t('jobs.kind'),
      rowHeader: true,
      cell: (job) => (
        <span className={layout.cellStack}>
          <Link className={layout.link} to={job.id}>
            <code>{job.kind}</code>
          </Link>
          <code className={layout.muted}>{job.id}</code>
        </span>
      ),
    },
    {
      id: 'status',
      header: (
        <>
          {t('jobs.status')}{' '}
          <InfoTip label={t('jobs.statusInfoLabel')} topic="jobs#statuses">
            {t('jobs.statusInfo')}
          </InfoTip>
        </>
      ),
      cell: (job) => <JobStatusCell job={job} />,
    },
    {
      id: 'attempts',
      header: (
        <>
          {t('jobs.attempts')}{' '}
          <InfoTip label={t('jobs.attemptsInfoLabel')} topic="jobs#retries">
            {t('jobs.attemptsInfo')}
          </InfoTip>
        </>
      ),
      hideOnMobile: true,
      cell: (job) => t('jobs.attemptsValue', { attempts: job.attempts, max: job.max_attempts }),
    },
    {
      id: 'tenant',
      header: t('jobs.tenant'),
      hideOnMobile: true,
      cell: (job) =>
        job.tenant_id ? (
          <code className={layout.mono}>{job.tenant_id}</code>
        ) : (
          <span className={layout.muted}>{t('jobs.productLevel')}</span>
        ),
    },
    {
      id: 'created',
      header: t('jobs.created'),
      hideOnMobile: true,
      cell: (job) => <Time value={job.created_at} />,
    },
    { id: 'updated', header: t('jobs.updated'), cell: (job) => <Time value={job.updated_at} /> },
  ];
  if (canManage) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (job) =>
        canRetryJob(job.status) || canCancelJob(job.status) ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`${menuStyles.iconButton} ${menuStyles.sm}`}
              aria-label={t('jobs.actionsFor', { id: job.id })}
            >
              <MoreHorizontal aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {canRetryJob(job.status) ? (
                <DropdownMenuItem
                  icon={<RotateCcw />}
                  onSelect={() => setConfirm({ action: 'retry', job })}
                >
                  {t('jobs.retry')}
                </DropdownMenuItem>
              ) : null}
              {canCancelJob(job.status) ? (
                <DropdownMenuItem
                  tone="danger"
                  icon={<Ban />}
                  onSelect={() => setConfirm({ action: 'cancel', job })}
                >
                  {t('jobs.cancel')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    });
  }

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('jobs.title')}
        description={t('jobs.description')}
        help="jobs"
        actions={
          <>
            <ButtonLink to="../schedules" relative="path" icon={<CalendarClock />}>
              {t('schedules.title')}
            </ButtonLink>
            {canEnqueue ? (
              <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
                {t('jobs.enqueue')}
              </Button>
            ) : null}
          </>
        }
      />
      {stats.data ? <JobStatsCard stats={stats.data} onStatus={filterStatus} /> : null}
      <Card flush>
        <form className={styles.filters} onSubmit={apply} aria-label={t('jobs.filters')}>
          <FormField label={t('jobs.status')}>
            <Select
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({ ...current, status: event.target.value as JobStatus }))
              }
            >
              <option value="">{t('jobs.allStatuses')}</option>
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`jobStatus.${status}`)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('jobs.kind')}>
            <Input
              value={draft.kind}
              onChange={(event) =>
                setDraft((current) => ({ ...current, kind: event.target.value }))
              }
              placeholder="reports.send"
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
            {activeFilters > 0 ? (
              <Button variant="ghost" icon={<FilterX />} onClick={reset}>
                {t('filters.reset')}
              </Button>
            ) : null}
          </div>
        </form>
        <div className={styles.liveRow}>
          <Switch
            checked={live}
            onCheckedChange={setLive}
            label={t('jobs.live')}
            description={t('jobs.liveHelp')}
          />
          {live ? <StreamIndicator stream={stream} /> : null}
        </div>
        <DataTable
          caption={t('jobs.title')}
          columns={columns}
          getRowId={(job) => job.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<ListChecks />}
              title={activeFilters ? t('jobs.emptyFiltered') : t('jobs.empty')}
              description={activeFilters ? undefined : t('jobs.emptyBody')}
              action={
                activeFilters ? undefined : (
                  <HelpLink topic="jobs">{t('common:help.learnMore')}</HelpLink>
                )
              }
            />
          }
          {...tableProps}
        />
      </Card>
      {creating ? (
        <EnqueueJobDialog
          productId={productId}
          restricted={!canManage}
          onClose={() => setCreating(false)}
          onCreated={(job) => {
            void queryClient.invalidateQueries({ queryKey: ['products', productId, 'jobs'] });
            void navigate(job.id);
          }}
        />
      ) : null}
      <JobActionDialog
        productId={productId}
        value={confirm}
        onClose={() => setConfirm(null)}
        onDone={() =>
          void queryClient.invalidateQueries({ queryKey: ['products', productId, 'jobs'] })
        }
      />
    </div>
  );
}

function JobStatusCell({ job }: { job: Job }) {
  const { t } = useTranslation('events');
  return (
    <span className={layout.cellStack}>
      <JobStatusPill status={job.status} />
      {job.cancel_requested && job.status === 'running' ? (
        <span className={layout.muted}>{t('jobs.cancelRequested')}</span>
      ) : null}
      {isSkippedJob(job) ? <span className={layout.muted}>{t('jobs.skipped')}</span> : null}
    </span>
  );
}

function JobStatsCard({
  stats,
  onStatus,
}: {
  stats: JobStats;
  onStatus: (status: JobStatus) => void;
}) {
  const { t } = useTranslation('events');
  const format = useFormatters();
  return (
    <Card title={t('jobs.stats.title')} headingLevel={2}>
      <ul className={styles.stats}>
        {JOB_STATUSES.map((status) => (
          <li key={status}>
            <button type="button" className={styles.stat} onClick={() => onStatus(status)}>
              <span className={styles.statValue}>{format.number(stats.counts[status] ?? 0)}</span>{' '}
              <span className={styles.statLabel}>{t(`jobStatus.${status}`)}</span>
              <span className="ax-sr-only">{t('jobs.stats.filterHint')}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={layout.muted}>
        {t('jobs.stats.last24h', {
          succeeded: format.number(stats.succeeded_last_24h),
          failed: format.number(stats.failed_last_24h),
        })}{' '}
        {stats.oldest_queued_at ? (
          <>
            {t('jobs.stats.oldestQueued')} <Time value={stats.oldest_queued_at} />
          </>
        ) : (
          t('jobs.stats.noneQueued')
        )}
      </p>
    </Card>
  );
}

/** Retry (failed/dead) or cancel (queued/running) with a confirmation that names the job. */
export function JobActionDialog({
  productId,
  value,
  onClose,
  onDone,
}: {
  productId: string;
  value: JobAction | null;
  onClose: () => void;
  onDone: (job: Job) => void;
}) {
  const { t } = useTranslation('events');
  const toast = useToast();
  const showError = useErrorToast();
  const retry = value?.action === 'retry';
  return (
    <ConfirmDialog
      open={value !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      tone={retry ? 'primary' : 'danger'}
      title={retry ? t('jobs.retryTitle') : t('jobs.cancelTitle')}
      description={
        value
          ? retry
            ? t('jobs.retryBody', { kind: value.job.kind, id: value.job.id })
            : value.job.status === 'running'
              ? t('jobs.cancelRunningBody', { kind: value.job.kind, id: value.job.id })
              : t('jobs.cancelQueuedBody', { kind: value.job.kind, id: value.job.id })
          : undefined
      }
      confirmLabel={retry ? t('jobs.retry') : t('jobs.cancel')}
      onConfirm={async () => {
        if (!value) return;
        try {
          const job = retry
            ? await jobsApi.retry(productId, value.job.id)
            : await jobsApi.cancel(productId, value.job.id);
          toast.success(
            retry
              ? t('jobs.retried')
              : job.status === 'cancelled'
                ? t('jobs.cancelled')
                : t('jobs.cancelRequestedToast'),
          );
          onDone(job);
        } catch (error) {
          showError(error);
          throw error;
        }
      }}
    >
      <HelpLink topic={retry ? 'jobs#retry' : 'jobs#cancel'}>{t('common:help.learnMore')}</HelpLink>
    </ConfirmDialog>
  );
}

function EnqueueJobDialog({
  productId,
  restricted,
  onClose,
  onCreated,
}: {
  productId: string;
  /** Without jobs:manage: a tenant is required and only the kinds opened to the caller there. */
  restricted: boolean;
  onClose: () => void;
  onCreated: (job: Job) => void;
}) {
  const { t } = useTranslation('events');
  const toast = useToast();
  const [kind, setKind] = useState('');
  const [payload, setPayload] = useState('{}');
  const [tenantId, setTenantId] = useState('');
  const [priority, setPriority] = useState('0');
  const [delay, setDelay] = useState('0');
  const [maxAttempts, setMaxAttempts] = useState('');
  // One key per dialog: submitting twice (double click, retry after a timeout) enqueues once.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const parsed = parseJsonObject(payload);
  const kindIssue = kindProblem(kind);
  // Known kinds: suggestions for jobs:manage holders (any kind allowed), the only choices
  // otherwise. Listed by the answering API process from its declarations.
  const kinds = useQuery({
    queryKey: queryKeys.jobKinds(productId, tenantId),
    queryFn: () => jobsApi.kinds(productId, tenantId || undefined),
    enabled: !restricted || Boolean(tenantId),
    retry: false,
  });
  const knownKinds = kinds.data?.items ?? [];
  const noOpenKinds = restricted && Boolean(tenantId) && kinds.isSuccess && knownKinds.length === 0;
  const kindsListId = useId();

  const enqueue = useMutation({
    mutationFn: () =>
      jobsApi.enqueue(
        productId,
        {
          kind: kind.trim(),
          payload: parsed.ok ? parsed.value : {},
          priority: Number(priority) || 0,
          delay_seconds: Number(delay) || 0,
          ...(tenantId ? { tenant_id: tenantId } : {}),
          ...(maxAttempts ? { max_attempts: Number(maxAttempts) } : {}),
        },
        idempotencyKey.trim() || undefined,
      ),
    onSuccess: (job) => {
      toast.success(t('jobs.enqueued', { kind: job.kind }));
      onCreated(job);
    },
  });
  const fields = enqueue.error ? fieldErrors(enqueue.error) : {};
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!kind.trim() || kindIssue || !parsed.ok) return;
    enqueue.mutate();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={t('jobs.enqueue')}
      description={t('jobs.enqueueDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="enqueue-form"
            variant="primary"
            loading={enqueue.isPending}
            disabled={!kind.trim() || Boolean(kindIssue) || !parsed.ok}
          >
            {t('jobs.enqueueSubmit')}
          </Button>
        </>
      }
    >
      <form id="enqueue-form" className={layout.form} onSubmit={submit} noValidate>
        {isIdempotencyConflict(enqueue.error) ? (
          <Alert tone="warning" title={t('common:idempotency.conflictTitle')}>
            <p>{t('common:idempotency.conflictManual')}</p>
            <div className={layout.actions}>
              <Button
                icon={<RefreshCw />}
                onClick={() => {
                  setIdempotencyKey(newIdempotencyKey());
                  enqueue.reset();
                }}
              >
                {t('common:idempotency.newKey')}
              </Button>
            </div>
          </Alert>
        ) : (
          <FormError error={enqueue.error} />
        )}
        {restricted ? (
          <TenantPicker
            productId={productId}
            value={tenantId}
            onChange={(next) => {
              setTenantId(next);
              setKind('');
            }}
            label={t('jobs.tenant')}
            help={t('jobs.tenantRequired')}
          />
        ) : null}
        {noOpenKinds ? (
          <Alert tone="info" title={t('jobs.noOpenKindsTitle')}>
            {t('jobs.noOpenKinds')}{' '}
            <HelpLink topic="jobs#kind-permissions">{t('common:help.learnMore')}</HelpLink>
          </Alert>
        ) : null}
        {restricted ? (
          <FormField
            label={t('jobs.kind')}
            help={t('jobs.kindOpenHelp')}
            info={t('jobs.kindInfo')}
            infoTopic="jobs#workers"
            error={fields.kind}
            required
          >
            <Select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              disabled={!tenantId || knownKinds.length === 0}
            >
              <option value="" disabled>
                {tenantId && kinds.isPending ? t('common:states.loading') : t('jobs.chooseKind')}
              </option>
              {knownKinds.map((entry) => (
                <option key={entry.kind} value={entry.kind}>
                  {entry.kind}
                </option>
              ))}
            </Select>
          </FormField>
        ) : (
          <FormField
            label={t('jobs.kind')}
            help={t('jobs.kindHelp')}
            info={t('jobs.kindInfo')}
            infoTopic="jobs#workers"
            error={kindIssue ? t(`validation.kind.${kindIssue}`) : fields.kind}
            required
          >
            <Input
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              placeholder="reports.send"
              autoComplete="off"
              spellCheck={false}
              list={knownKinds.length ? kindsListId : undefined}
            />
          </FormField>
        )}
        {!restricted && knownKinds.length ? (
          <datalist id={kindsListId}>
            {knownKinds.map((entry) => (
              <option key={entry.kind} value={entry.kind} />
            ))}
          </datalist>
        ) : null}
        <FormField
          label={t('jobs.payload')}
          help={t('jobs.payloadHelp')}
          info={t('jobs.payloadInfo')}
          infoTopic="jobs#enqueue"
          error={parsed.ok ? fields.payload : t('validation.jsonObject')}
        >
          <Textarea
            mono
            rows={6}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            spellCheck={false}
          />
        </FormField>
        {restricted ? null : (
          <TenantPicker
            productId={productId}
            value={tenantId}
            onChange={setTenantId}
            label={t('jobs.tenant')}
            allowNone
            noneLabel={t('jobs.productLevel')}
          />
        )}
        <div className={layout.row}>
          <FormField
            label={t('jobs.priority')}
            help={t('jobs.priorityHelp')}
            info={t('jobs.priorityInfo')}
            error={fields.priority}
          >
            <Input
              type="number"
              min={-100}
              max={100}
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            />
          </FormField>
          <FormField
            label={t('jobs.delay')}
            help={t('jobs.delayHelp')}
            error={fields.delay_seconds}
          >
            <Input
              type="number"
              min={0}
              value={delay}
              onChange={(event) => setDelay(event.target.value)}
            />
          </FormField>
          <FormField
            label={t('jobs.maxAttempts')}
            help={t('jobs.maxAttemptsHelp')}
            info={t('jobs.maxAttemptsInfo')}
            infoTopic="jobs#retries"
            error={fields.max_attempts}
          >
            <Input
              type="number"
              min={1}
              max={100}
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(event.target.value)}
            />
          </FormField>
        </div>
        <FormField
          label={t('jobs.idempotencyKey')}
          help={t('jobs.idempotencyKeyHelp')}
          info={t('jobs.idempotencyKeyInfo')}
          infoTopic="jobs#idempotency-key"
        >
          <Input
            value={idempotencyKey}
            onChange={(event) => setIdempotencyKey(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
