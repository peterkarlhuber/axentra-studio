import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, MoreHorizontal, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { schedulesApi } from '@/api/endpoints';
import type { Schedule, ScheduleInput, SchedulePatch } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  StatusPill,
  Switch,
  Textarea,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { useCursorList } from '@/lib/useCursorList';
import { TenantPicker } from '@/features/shared/TenantPicker';
import menuStyles from '@/components/ui/IconButton.module.css';
import { CRON_PRESETS, cronProblemText, validateCron } from './cron';
import {
  INTERVAL_UNITS,
  MAX_INTERVAL_SECONDS,
  MIN_INTERVAL_SECONDS,
  intervalSeconds,
  kindProblem,
  parseJsonObject,
  splitInterval,
  type IntervalUnit,
} from './events-utils';
import { FormError } from './shared';
import styles from './events.module.css';

export function SchedulesPage() {
  const { t } = useTranslation('events');
  const { productId } = useProductScope();
  const can = useCan();
  const canManage = can('jobs:manage');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const creating = params.get('new') === '1' && canManage;
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const key = queryKeys.schedules(productId);
  const { tableProps } = useCursorList(key, (cursor) => schedulesApi.list(productId, { cursor }));
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const setCreating = (open: boolean) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (open) next.set('new', '1');
        else next.delete('new');
        return next;
      },
      { replace: true },
    );

  const toggle = useMutation({
    mutationFn: (schedule: Schedule) =>
      schedulesApi.update(productId, schedule.id, { enabled: !schedule.enabled }, schedule.version),
    onSuccess: (updated) => {
      toast.success(
        updated.enabled
          ? t('schedules.enabledToast', { name: updated.name })
          : t('schedules.disabledToast', { name: updated.name }),
      );
      void invalidate();
    },
    onError: (error) => {
      showError(error);
      void invalidate();
    },
  });

  const columns: Column<Schedule>[] = [
    {
      id: 'name',
      header: t('schedules.name'),
      rowHeader: true,
      cell: (schedule) => (
        <span className={layout.cellStack}>
          <span>{schedule.name}</span>
          <code className={layout.muted}>{schedule.kind}</code>
        </span>
      ),
    },
    {
      id: 'timing',
      header: t('schedules.timing'),
      cell: (schedule) => <Timing schedule={schedule} />,
    },
    {
      id: 'state',
      header: t('schedules.state'),
      cell: (schedule) => <StatusPill status={schedule.enabled ? 'active' : 'disabled'} />,
    },
    {
      id: 'next',
      header: t('schedules.nextRun'),
      cell: (schedule) =>
        schedule.enabled ? (
          <Time value={schedule.next_run_at} />
        ) : (
          <span className={layout.muted}>{t('schedules.paused')}</span>
        ),
    },
    {
      id: 'last',
      header: t('schedules.lastRun'),
      hideOnMobile: true,
      cell: (schedule) =>
        schedule.last_job_id ? (
          <Link className={layout.link} to={`../jobs/${schedule.last_job_id}`} relative="path">
            <Time value={schedule.last_run_at} />
          </Link>
        ) : (
          <Time value={schedule.last_run_at} />
        ),
    },
    {
      id: 'tenant',
      header: t('jobs.tenant'),
      hideOnMobile: true,
      cell: (schedule) =>
        schedule.tenant_id ? (
          <code className={layout.mono}>{schedule.tenant_id}</code>
        ) : (
          <span className={layout.muted}>{t('jobs.productLevel')}</span>
        ),
    },
  ];
  if (canManage) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (schedule) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`${menuStyles.iconButton} ${menuStyles.sm}`}
            aria-label={t('schedules.actionsFor', { name: schedule.name })}
          >
            <MoreHorizontal aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Pencil />} onSelect={() => setEditing(schedule)}>
              {t('schedules.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={schedule.enabled ? <Pause /> : <Play />}
              onSelect={() => toggle.mutate(schedule)}
            >
              {schedule.enabled ? t('schedules.disable') : t('schedules.enable')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              tone="danger"
              icon={<Trash2 />}
              onSelect={() => setDeleting(schedule)}
            >
              {t('schedules.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('schedules.title')}
        description={t('schedules.description')}
        actions={
          canManage ? (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              {t('schedules.create')}
            </Button>
          ) : null
        }
      />
      <Card flush>
        <DataTable
          caption={t('schedules.title')}
          columns={columns}
          getRowId={(schedule) => schedule.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<CalendarClock />}
              title={t('schedules.empty')}
              description={canManage ? t('schedules.emptyBody') : undefined}
            />
          }
          {...tableProps}
        />
      </Card>
      {creating || editing ? (
        <ScheduleFormDialog
          productId={productId}
          schedule={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={(saved, created) => {
            toast.success(
              created
                ? t('schedules.created', { name: saved.name })
                : t('schedules.saved', { name: saved.name }),
            );
            setEditing(null);
            setCreating(false);
            void invalidate();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title={t('schedules.deleteTitle')}
        description={t('schedules.deleteBody', { name: deleting?.name ?? '' })}
        confirmLabel={t('schedules.delete')}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await schedulesApi.remove(productId, deleting.id, deleting.version);
            toast.success(t('schedules.deleted', { name: deleting.name }));
            void invalidate();
          } catch (error) {
            showError(error);
            void invalidate();
            throw error;
          }
        }}
      />
    </div>
  );
}

function Timing({ schedule }: { schedule: Schedule }) {
  const { t } = useTranslation('events');
  if (schedule.cron) {
    return (
      <span className={layout.cellStack}>
        <code>{schedule.cron}</code>
        <span className={layout.muted}>{t('schedules.cronUtc')}</span>
      </span>
    );
  }
  if (schedule.interval_seconds) {
    const { amount, unit } = splitInterval(schedule.interval_seconds);
    return <span>{t(`schedules.every.${unit}`, { count: amount })}</span>;
  }
  return null;
}

function ScheduleFormDialog({
  productId,
  schedule,
  onClose,
  onSaved,
}: {
  productId: string;
  schedule: Schedule | null;
  onClose: () => void;
  onSaved: (schedule: Schedule, created: boolean) => void;
}) {
  const { t } = useTranslation('events');
  const modeName = useId();
  const initialInterval = splitInterval(schedule?.interval_seconds ?? 3600);
  const [name, setName] = useState(schedule?.name ?? '');
  const [kind, setKind] = useState(schedule?.kind ?? '');
  const [mode, setMode] = useState<'interval' | 'cron'>(schedule?.cron ? 'cron' : 'interval');
  const [amount, setAmount] = useState(String(initialInterval.amount));
  const [unit, setUnit] = useState<IntervalUnit>(initialInterval.unit);
  const [cron, setCron] = useState(schedule?.cron ?? '');
  const [payload, setPayload] = useState(JSON.stringify(schedule?.payload ?? {}, null, 2));
  const [tenantId, setTenantId] = useState('');
  const [priority, setPriority] = useState(String(schedule?.priority ?? 0));
  const [maxAttempts, setMaxAttempts] = useState(String(schedule?.max_attempts ?? 5));
  const [enabled, setEnabled] = useState(schedule?.enabled ?? true);
  const [touchedCron, setTouchedCron] = useState(false);

  const parsed = parseJsonObject(payload);
  const kindIssue = kindProblem(kind);
  const seconds = intervalSeconds(Number(amount), unit);
  const intervalIssue =
    mode === 'interval' &&
    (!Number.isFinite(seconds) || seconds < MIN_INTERVAL_SECONDS || seconds > MAX_INTERVAL_SECONDS);
  const cronIssue = mode === 'cron' ? validateCron(cron) : null;
  const invalid =
    !name.trim() ||
    !kind.trim() ||
    Boolean(kindIssue) ||
    !parsed.ok ||
    intervalIssue ||
    !!cronIssue;

  const save = useMutation({
    mutationFn: async (): Promise<Schedule> => {
      const timing =
        mode === 'cron'
          ? { cron: cron.trim().split(/\s+/).join(' '), interval_seconds: null }
          : { interval_seconds: seconds, cron: null };
      const common = {
        name: name.trim(),
        kind: kind.trim(),
        payload: parsed.ok ? parsed.value : {},
        priority: Number(priority) || 0,
        max_attempts: Number(maxAttempts) || 5,
        enabled,
      };
      if (!schedule) {
        const body: ScheduleInput = {
          ...common,
          ...timing,
          ...(tenantId ? { tenant_id: tenantId } : {}),
        };
        return schedulesApi.create(productId, body);
      }
      // Send only what changed, guarded by the version the form was opened with.
      const patch: SchedulePatch = {};
      if (common.name !== schedule.name) patch.name = common.name;
      if (common.kind !== schedule.kind) patch.kind = common.kind;
      if (JSON.stringify(common.payload) !== JSON.stringify(schedule.payload)) {
        patch.payload = common.payload;
      }
      if (common.priority !== schedule.priority) patch.priority = common.priority;
      if (common.max_attempts !== schedule.max_attempts) patch.max_attempts = common.max_attempts;
      if (common.enabled !== schedule.enabled) patch.enabled = common.enabled;
      if (timing.cron !== schedule.cron || timing.interval_seconds !== schedule.interval_seconds) {
        Object.assign(patch, timing);
      }
      if (Object.keys(patch).length === 0) return schedule;
      return schedulesApi.update(productId, schedule.id, patch, schedule.version);
    },
    onSuccess: (saved) => onSaved(saved, !schedule),
  });
  const fields = save.error ? fieldErrors(save.error) : {};

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouchedCron(true);
    if (invalid) return;
    save.mutate();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={schedule ? t('schedules.editTitle', { name: schedule.name }) : t('schedules.create')}
      description={t('schedules.formDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="schedule-form"
            variant="primary"
            loading={save.isPending}
            disabled={invalid}
          >
            {schedule ? t('common:actions.save') : t('schedules.createSubmit')}
          </Button>
        </>
      }
    >
      <form id="schedule-form" className={layout.form} onSubmit={submit} noValidate>
        <FormError error={save.error} />
        <FormField label={t('schedules.name')} error={fields.name} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
        </FormField>
        <FormField
          label={t('jobs.kind')}
          help={t('schedules.kindHelp')}
          error={kindIssue ? t(`validation.kind.${kindIssue}`) : fields.kind}
          required
        >
          <Input
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            placeholder="reports.send"
            autoComplete="off"
            spellCheck={false}
          />
        </FormField>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('schedules.timing')}</legend>
          <div className={styles.radios}>
            {(['interval', 'cron'] as const).map((value) => (
              <label key={value} className={styles.radio}>
                <input
                  type="radio"
                  name={modeName}
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                />
                {t(`schedules.mode.${value}`)}
              </label>
            ))}
          </div>
          {mode === 'interval' ? (
            <div className={layout.row}>
              <FormField
                label={t('schedules.intervalAmount')}
                error={
                  intervalIssue
                    ? t('validation.interval', {
                        min: MIN_INTERVAL_SECONDS,
                        max: MAX_INTERVAL_SECONDS,
                      })
                    : fields.interval_seconds
                }
                required
              >
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </FormField>
              <FormField label={t('schedules.intervalUnit')}>
                <Select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as IntervalUnit)}
                >
                  {INTERVAL_UNITS.map((entry) => (
                    <option key={entry.unit} value={entry.unit}>
                      {t(`schedules.unit.${entry.unit}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          ) : (
            <>
              <FormField
                label={t('schedules.cron')}
                help={t('schedules.cronHelp')}
                error={
                  cronIssue && (touchedCron || cron.trim())
                    ? cronProblemText(t, cronIssue)
                    : fields.cron
                }
                required
              >
                <Input
                  value={cron}
                  onChange={(event) => setCron(event.target.value)}
                  onBlur={() => setTouchedCron(true)}
                  placeholder="*/15 * * * *"
                  className={styles.monoInput}
                  autoComplete="off"
                  spellCheck={false}
                />
              </FormField>
              <div className={styles.presets} role="group" aria-label={t('schedules.presets')}>
                {CRON_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    size="sm"
                    variant="subtle"
                    aria-pressed={cron.trim() === preset.expression}
                    onClick={() => setCron(preset.expression)}
                  >
                    {t(`schedules.preset.${preset.id}`)}
                  </Button>
                ))}
              </div>
            </>
          )}
          <p className={layout.muted}>
            {schedule?.next_run_at && schedule.enabled ? (
              <>
                {t('schedules.currentNextRun')}{' '}
                <Time value={schedule.next_run_at} mode="absolute" />
                {' · '}
              </>
            ) : null}
            {t('schedules.nextRunHint')}
          </p>
        </fieldset>
        <FormField
          label={t('jobs.payload')}
          help={t('jobs.payloadHelp')}
          error={parsed.ok ? fields.payload : t('validation.jsonObject')}
        >
          <Textarea
            mono
            rows={5}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            spellCheck={false}
          />
        </FormField>
        {!schedule ? (
          <TenantPicker
            productId={productId}
            value={tenantId}
            onChange={setTenantId}
            label={t('jobs.tenant')}
            help={t('schedules.tenantHelp')}
            allowNone
            noneLabel={t('jobs.productLevel')}
          />
        ) : null}
        <div className={layout.row}>
          <FormField
            label={t('jobs.priority')}
            help={t('jobs.priorityHelp')}
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
          <FormField label={t('jobs.maxAttempts')} error={fields.max_attempts}>
            <Input
              type="number"
              min={1}
              max={100}
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(event.target.value)}
            />
          </FormField>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          label={t('schedules.enabled')}
          description={t('schedules.enabledHelp')}
        />
      </form>
    </Dialog>
  );
}
