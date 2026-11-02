import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gauge, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { usageApi } from '@/api/endpoints';
import type { MeterUsage, Reservation, UsageEvent } from '@/api/models';
import { usageBillingKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DetailList,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Select,
  Skeleton,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { InfoTip } from '@/help/InfoTip';
import clsx from '@/lib/clsx';
import { fieldErrors } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import { useCursorList } from '@/lib/useCursorList';
import { UsageChart } from './UsageChart';
import {
  ENFORCEMENTS,
  formatQuantity,
  lastDays,
  parseDecimal,
  RANGE_DAYS,
  usedPercent,
} from './usage-utils';
import styles from './usage.module.css';

/** Usage of one tenant: current period per meter with limits, daily chart, events, reservations. */
export function TenantUsagePanel({ productId, tenantId }: { productId: string; tenantId: string }) {
  const can = useCan();
  const scope = { tenantId };
  if (!can('usage:read', scope)) {
    return <NoTenantAccess />;
  }
  return (
    <div className={layout.stack}>
      <PeriodSummary productId={productId} tenantId={tenantId} canManage={can('usage:manage')} />
      <TenantChart productId={productId} tenantId={tenantId} />
      <EventsList productId={productId} tenantId={tenantId} />
      <ReservationLookup
        productId={productId}
        tenantId={tenantId}
        canRecord={can('usage:record', scope)}
      />
    </div>
  );
}

function NoTenantAccess() {
  const { t } = useTranslation('usage');
  return <EmptyState compact title={t('noAccess')} description={t('noAccessBody')} />;
}

function PeriodSummary({
  productId,
  tenantId,
  canManage,
}: {
  productId: string;
  tenantId: string;
  canManage: boolean;
}) {
  const { t } = useTranslation('usage');
  const { locale, dateTime } = useFormatters();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [day, setDay] = useState('');
  const [quotaFor, setQuotaFor] = useState<MeterUsage | null>(null);
  const [removing, setRemoving] = useState<MeterUsage | null>(null);
  // Any time inside the wanted period; noon UTC of the chosen day avoids zone edge cases.
  const at = day ? `${day}T12:00:00Z` : undefined;
  const summary = useQuery({
    queryKey: usageBillingKeys.tenantUsageSummary(productId, tenantId, at),
    queryFn: () => usageApi.tenantSummary(productId, tenantId, at),
  });
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: usageBillingKeys.tenantUsage(productId, tenantId) });
  const quantity = (value: number | null) => formatQuantity(value, locale);

  return (
    <Card
      title={t('tenant.periodTitle')}
      description={
        <>
          {t('tenant.periodDescription')}{' '}
          <InfoTip label={t('info.limitSourceLabel')} topic="usage#limit-source">
            {t('info.limitSource')}
          </InfoTip>
        </>
      }
    >
      <div className={layout.stack}>
        <div className={styles.filters}>
          <FormField
            label={t('tenant.periodAt')}
            help={t('tenant.periodAtHelp')}
            info={t('info.periodAt')}
            infoTopic="usage#fixed-periods"
          >
            <Input type="date" value={day} onChange={(event) => setDay(event.target.value)} />
          </FormField>
        </div>
        {summary.isPending ? (
          <Skeleton height={140} radius={12} />
        ) : summary.isError ? (
          <ErrorState
            error={summary.error}
            onRetry={() => void summary.refetch()}
            compact
            headingLevel={3}
          />
        ) : summary.data.length === 0 ? (
          <EmptyState compact headingLevel={3} icon={<Gauge />} title={t('overview.noMeters')} />
        ) : (
          <ul className={styles.meterGrid}>
            {summary.data.map((usage) => {
              const used = usage.value + usage.reserved;
              const percent = usedPercent(used, usage.limit);
              const unit = usage.unit ? ` ${usage.unit}` : '';
              return (
                <li key={usage.meter} className={styles.meterCard}>
                  <div className={styles.meterHead}>
                    <h3 className={styles.meterName}>{usage.name || usage.meter}</h3>
                    <code className={layout.muted}>{usage.meter}</code>
                  </div>
                  <span className={styles.meterValue}>
                    {quantity(usage.value)}
                    {unit}
                  </span>
                  {usage.limit === null ? (
                    <span className={layout.muted}>{t('limits.unlimited')}</span>
                  ) : (
                    <>
                      <progress
                        className={clsx(styles.progress, usage.over_limit && styles.over)}
                        max={100}
                        value={Math.min(100, percent ?? 0)}
                        aria-label={t('tenant.usedOfLimit', {
                          meter: usage.name || usage.meter,
                          percent: Math.round(percent ?? 0),
                        })}
                      />
                      <span className={layout.muted}>
                        {t('tenant.ofLimit', {
                          used: quantity(used),
                          limit: `${quantity(usage.limit)}${unit}`,
                          percent: Math.round(percent ?? 0),
                        })}
                      </span>
                    </>
                  )}
                  <span className={layout.tags}>
                    <Badge tone="info">
                      {t(`source.${usage.source}`, { defaultValue: usage.source })}
                    </Badge>
                    {usage.limit !== null ? (
                      <Badge>
                        {t(`enforcement.${usage.enforcement}`, { defaultValue: usage.enforcement })}
                      </Badge>
                    ) : null}
                    {usage.over_limit ? <Badge tone="danger">{t('tenant.overLimit')}</Badge> : null}
                  </span>
                  <DetailList
                    items={[
                      {
                        label: t('tenant.period'),
                        value: usage.period_end
                          ? t('tenant.periodRange', {
                              from: dateTime(usage.period_start),
                              to: dateTime(usage.period_end),
                            })
                          : t('tenant.periodSince', { from: dateTime(usage.period_start) }),
                      },
                      { label: t('tenant.events'), value: quantity(usage.event_count) },
                      usage.reserved > 0
                        ? {
                            label: t('tenant.reserved'),
                            value: `${quantity(usage.reserved)}${unit}`,
                          }
                        : null,
                      usage.remaining !== null
                        ? {
                            label: t('tenant.remaining'),
                            value: `${quantity(usage.remaining)}${unit}`,
                          }
                        : null,
                    ]}
                  />
                  {canManage ? (
                    <div className={styles.meterActions}>
                      <Button size="sm" onClick={() => setQuotaFor(usage)}>
                        {t('quota.set')}
                      </Button>
                      {usage.source === 'quota' ? (
                        <Button size="sm" variant="ghost" onClick={() => setRemoving(usage)}>
                          {t('quota.remove')}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {quotaFor ? (
        <QuotaDialog
          productId={productId}
          tenantId={tenantId}
          usage={quotaFor}
          onClose={() => setQuotaFor(null)}
          onSaved={() => {
            setQuotaFor(null);
            toast.success(t('quota.saved'));
            void invalidate();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => (open ? undefined : setRemoving(null))}
        title={t('quota.removeTitle')}
        description={t('quota.removeBody', { meter: removing?.name || removing?.meter })}
        confirmLabel={t('quota.remove')}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await usageApi.deleteQuota(productId, tenantId, removing.meter);
            toast.success(t('quota.removed'));
            void invalidate();
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </Card>
  );
}

function QuotaDialog({
  productId,
  tenantId,
  usage,
  onClose,
  onSaved,
}: {
  productId: string;
  tenantId: string;
  usage: MeterUsage;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('usage');
  const showError = useErrorToast();
  const [limit, setLimit] = useState(usage.limit === null ? '' : String(usage.limit));
  const [enforcement, setEnforcement] = useState<string>(usage.enforcement || 'hard');
  const parsed = parseDecimal(limit);
  const invalid = Number.isNaN(parsed) || (parsed !== null && parsed < 0);
  const save = useMutation({
    mutationFn: () =>
      usageApi.setQuota(productId, tenantId, usage.meter, {
        limit: parsed,
        enforcement: enforcement as 'hard' | 'soft',
      }),
    onSuccess: onSaved,
    onError: showError,
  });
  const fields = save.error ? fieldErrors(save.error) : {};
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t('quota.title', { meter: usage.name || usage.meter })}
      description={
        <>
          {t('quota.description')}{' '}
          <HelpLink topic="usage#quota-override">{t('common:help.learnMore')}</HelpLink>
        </>
      }
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
            {t('quota.save')}
          </Button>
        </>
      }
    >
      <form id="quota-form" className={layout.form} onSubmit={submit}>
        <FormField
          label={t('quota.limit')}
          help={t('quota.limitHelp')}
          info={t('info.quotaLimit')}
          infoTopic="usage#quota-override"
          error={invalid ? t('meters.limitInvalid') : fields.limit}
        >
          <Input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
          />
        </FormField>
        <FormField
          label={t('meters.enforcement')}
          help={t('meters.enforcementHelp')}
          info={t('info.enforcement')}
          infoTopic="usage#enforcement"
        >
          <Select value={enforcement} onChange={(event) => setEnforcement(event.target.value)}>
            {ENFORCEMENTS.map((value) => (
              <option key={value} value={value}>
                {t(`enforcement.${value}`)}
              </option>
            ))}
          </Select>
        </FormField>
      </form>
    </Dialog>
  );
}

function useTenantMeters(productId: string, tenantId: string) {
  return useQuery({
    queryKey: usageBillingKeys.tenantUsageSummary(productId, tenantId, undefined),
    queryFn: () => usageApi.tenantSummary(productId, tenantId),
  });
}

function TenantChart({ productId, tenantId }: { productId: string; tenantId: string }) {
  const { t } = useTranslation('usage');
  const meters = useTenantMeters(productId, tenantId);
  const [meterKey, setMeterKey] = useState('');
  const [days, setDays] = useState<number>(30);
  const range = lastDays(days);
  const list = meters.data ?? [];
  const selected = list.find((meter) => meter.meter === meterKey) ?? list[0];
  const series = useQuery({
    queryKey: usageBillingKeys.tenantTimeseries(productId, tenantId, {
      meter: selected?.meter,
      ...range,
    }),
    queryFn: () => usageApi.tenantTimeseries(productId, tenantId, selected?.meter ?? '', range),
    enabled: Boolean(selected),
  });
  if (!selected) return null;
  return (
    <Card title={t('tenant.chartTitle')}>
      <div className={layout.stack}>
        <div className={styles.filters}>
          <FormField label={t('overview.meter')}>
            <Select value={selected.meter} onChange={(event) => setMeterKey(event.target.value)}>
              {list.map((meter) => (
                <option key={meter.meter} value={meter.meter}>
                  {meter.name ? `${meter.name} (${meter.meter})` : meter.meter}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('overview.range')}>
            <Select value={String(days)} onChange={(event) => setDays(Number(event.target.value))}>
              {RANGE_DAYS.map((value) => (
                <option key={value} value={value}>
                  {t('overview.lastDays', { count: value })}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        {series.isPending ? (
          <Skeleton height={220} radius={8} />
        ) : series.isError ? (
          <ErrorState
            error={series.error}
            onRetry={() => void series.refetch()}
            compact
            headingLevel={3}
          />
        ) : (
          <UsageChart
            points={series.data.points}
            unit={series.data.unit}
            title={t('tenant.chartCaption', { meter: selected.name || selected.meter })}
          />
        )}
      </div>
    </Card>
  );
}

function EventsList({ productId, tenantId }: { productId: string; tenantId: string }) {
  const { t } = useTranslation('usage');
  const { locale } = useFormatters();
  const meters = useTenantMeters(productId, tenantId);
  const [meter, setMeter] = useState('');
  const params = { meter };
  const list = useCursorList<UsageEvent>(
    usageBillingKeys.usageEvents(productId, tenantId, params),
    (cursor) => usageApi.events(productId, tenantId, { ...params, limit: 50, cursor }),
  );
  const columns: Column<UsageEvent>[] = [
    {
      id: 'occurred',
      header: t('events.occurred'),
      rowHeader: true,
      cell: (event) => <Time value={event.occurred_at} mode="absolute" />,
    },
    { id: 'meter', header: t('events.meter'), cell: (event) => <code>{event.meter}</code> },
    {
      id: 'quantity',
      header: t('events.quantity'),
      align: 'end',
      cell: (event) => formatQuantity(event.quantity, locale),
    },
    {
      id: 'key',
      header: t('events.idempotencyKey'),
      hideOnMobile: true,
      cell: (event) => <code className={layout.mono}>{event.idempotency_key}</code>,
    },
    {
      id: 'properties',
      header: t('events.properties'),
      hideOnMobile: true,
      cell: (event) =>
        Object.keys(event.properties ?? {}).length ? (
          <code className={layout.mono}>{JSON.stringify(event.properties)}</code>
        ) : (
          '—'
        ),
    },
    {
      id: 'recorded',
      header: t('events.recorded'),
      hideOnMobile: true,
      cell: (event) => <Time value={event.recorded_at} />,
    },
  ];
  return (
    <Card flush title={t('events.title')} description={t('events.description')}>
      <div className={layout.toolbar}>
        <FormField label={t('events.filterMeter')}>
          <Select value={meter} onChange={(event) => setMeter(event.target.value)}>
            <option value="">{t('events.allMeters')}</option>
            {(meters.data ?? []).map((item) => (
              <option key={item.meter} value={item.meter}>
                {item.meter}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <DataTable
        caption={t('events.title')}
        columns={columns}
        getRowId={(event) => event.id}
        empty={<EmptyState compact headingLevel={3} title={t('events.empty')} />}
        {...list.tableProps}
      />
    </Card>
  );
}

function ReservationLookup({
  productId,
  tenantId,
  canRecord,
}: {
  productId: string;
  tenantId: string;
  canRecord: boolean;
}) {
  const { t } = useTranslation('usage');
  const { locale } = useFormatters();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [commitQuantity, setCommitQuantity] = useState('');
  const [releasing, setReleasing] = useState(false);
  const key = usageBillingKeys.reservation(productId, tenantId, reservationId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => usageApi.reservation(productId, tenantId, reservationId),
    enabled: Boolean(reservationId),
  });
  const parsedCommit = parseDecimal(commitQuantity);
  const commitInvalid = Number.isNaN(parsedCommit) || (parsedCommit !== null && parsedCommit < 0);
  const refresh = (reservation?: Reservation) => {
    if (reservation) queryClient.setQueryData(key, reservation);
    void queryClient.invalidateQueries({
      queryKey: usageBillingKeys.tenantUsage(productId, tenantId),
    });
  };
  const commit = useMutation({
    mutationFn: () =>
      usageApi.commitReservation(productId, tenantId, reservationId, {
        ...(parsedCommit !== null ? { quantity: parsedCommit } : {}),
      }),
    onSuccess: () => {
      toast.success(t('reservations.committed'));
      setCommitQuantity('');
      refresh();
    },
    onError: showError,
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setReservationId(input.trim());
  };
  const reservation = query.data;

  return (
    <Card
      title={t('reservations.title')}
      description={
        <>
          {t('reservations.description')}{' '}
          <HelpLink topic="usage#reservations">{t('common:help.learnMore')}</HelpLink>
        </>
      }
    >
      <div className={layout.stack}>
        <form className={styles.filters} onSubmit={submit}>
          <FormField label={t('reservations.id')}>
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </FormField>
          <div>
            <Button type="submit" icon={<Search />} disabled={!input.trim()}>
              {t('reservations.lookup')}
            </Button>
          </div>
        </form>
        {!reservationId ? null : query.isPending ? (
          <Skeleton height={120} radius={8} />
        ) : query.isError ? (
          <ErrorState
            error={query.error}
            onRetry={() => void query.refetch()}
            compact
            headingLevel={3}
          />
        ) : reservation ? (
          <>
            <DetailList
              columns={2}
              items={[
                { label: t('reservations.id'), value: reservation.id, mono: true },
                {
                  label: t('reservations.status'),
                  value: (
                    <Badge tone={reservation.status === 'active' ? 'info' : 'neutral'}>
                      {t(`reservations.statuses.${reservation.status}`, {
                        defaultValue: reservation.status,
                      })}
                    </Badge>
                  ),
                },
                { label: t('events.meter'), value: reservation.meter, mono: true },
                {
                  label: t('reservations.quantity'),
                  value: formatQuantity(reservation.quantity, locale),
                },
                {
                  label: t('reservations.expires'),
                  value: <Time value={reservation.expires_at} mode="absolute" />,
                },
                reservation.committed_quantity !== null
                  ? {
                      label: t('reservations.committedQuantity'),
                      value: formatQuantity(reservation.committed_quantity, locale),
                    }
                  : null,
                reservation.event_id
                  ? { label: t('reservations.event'), value: reservation.event_id, mono: true }
                  : null,
              ]}
            />
            {reservation.status === 'active' && canRecord ? (
              <div className={styles.filters}>
                <FormField
                  label={t('reservations.commitQuantity')}
                  help={t('reservations.commitQuantityHelp')}
                  info={t('info.commit')}
                  infoTopic="usage#reservations"
                  error={commitInvalid ? t('meters.limitInvalid') : undefined}
                >
                  <Input
                    value={commitQuantity}
                    onChange={(event) => setCommitQuantity(event.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                  />
                </FormField>
                <div className={layout.actions}>
                  <Button
                    variant="primary"
                    loading={commit.isPending}
                    disabled={commitInvalid}
                    onClick={() => commit.mutate()}
                  >
                    {t('reservations.commit')}
                  </Button>
                  <Button variant="ghost" onClick={() => setReleasing(true)}>
                    {t('reservations.release')}
                  </Button>
                </div>
              </div>
            ) : null}
            {reservation.status === 'active' && !canRecord ? (
              <Alert tone="info">{t('reservations.readOnly')}</Alert>
            ) : null}
          </>
        ) : null}
      </div>
      <ConfirmDialog
        open={releasing}
        onOpenChange={setReleasing}
        title={t('reservations.releaseTitle')}
        description={t('reservations.releaseBody')}
        confirmLabel={t('reservations.release')}
        onConfirm={async () => {
          try {
            const released = await usageApi.releaseReservation(productId, tenantId, reservationId);
            toast.success(t('reservations.released'));
            refresh(released);
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </Card>
  );
}
