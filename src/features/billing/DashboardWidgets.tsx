import { useQuery } from '@tanstack/react-query';
import { BarChart3, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { billingApi, usageApi } from '@/api/endpoints';
import { usageBillingKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useMeta } from '@/app/contexts';
import { isModuleEnabled } from '@/app/modules';
import { Badge, ButtonLink, Card, ErrorState, Skeleton, layout } from '@/components/ui';
import { formatQuantity, monthStart, totalsByMeter } from '@/features/usage/usage-utils';
import { useFormatters } from '@/lib/format';
import { statusTone, SUBSCRIPTION_STATUSES } from './billing-utils';
import styles from './billing.module.css';

const SAMPLE = 200;

/** Usage and billing summary cards for the product dashboard, from the real endpoints only. */
export function UsageBillingWidgets({ productId }: { productId: string }) {
  const meta = useMeta();
  const can = useCan();
  const usage = isModuleEnabled(meta.modules, 'usage') && can('usage:read');
  const billing = isModuleEnabled(meta.modules, 'billing') && can('billing:read');
  if (!usage && !billing) return null;
  return (
    <div className={layout.grid2}>
      {usage ? <UsageWidget productId={productId} /> : null}
      {billing ? <BillingWidget productId={productId} /> : null}
    </div>
  );
}

function UsageWidget({ productId }: { productId: string }) {
  const { t } = useTranslation('usage');
  const { locale } = useFormatters();
  const since = monthStart();
  const meters = useQuery({
    queryKey: usageBillingKeys.meters(productId),
    queryFn: () => usageApi.meters(productId),
  });
  const summary = useQuery({
    queryKey: usageBillingKeys.productUsageSummary(productId, { since, limit: SAMPLE }),
    queryFn: () => usageApi.productSummary(productId, { since, limit: SAMPLE }),
  });
  const failed = meters.error ?? summary.error;
  const active = (meters.data ?? []).filter((meter) => meter.active);
  const totals = totalsByMeter(active, summary.data?.items ?? []);
  return (
    <Card
      title={
        <span>
          <BarChart3 aria-hidden width={18} height={18} /> {t('widget.title')}
        </span>
      }
      actions={
        <ButtonLink to={`/p/${encodeURIComponent(productId)}/usage`} size="sm" variant="ghost">
          {t('widget.open')}
        </ButtonLink>
      }
    >
      {failed ? (
        <ErrorState
          error={failed}
          onRetry={() => {
            void meters.refetch();
            void summary.refetch();
          }}
          compact
          headingLevel={3}
        />
      ) : meters.isPending || summary.isPending ? (
        <Skeleton height={80} />
      ) : (
        <div className={layout.stack}>
          <p className={layout.muted}>
            {t('widget.meters', { count: active.length, total: meters.data?.length ?? 0 })}
          </p>
          {totals.length ? (
            <ul className={styles.widgetList} aria-label={t('widget.thisMonth')}>
              {totals.slice(0, 5).map(({ meter, tenants, events, value }) => (
                <li key={meter.id} className={styles.widgetRow}>
                  <span>
                    <span>{meter.name || meter.key}</span>{' '}
                    <code className={layout.muted}>{meter.key}</code>
                  </span>
                  <span>
                    {value !== null ? (
                      <span className={styles.widgetValue}>
                        {formatQuantity(value, locale)}
                        {meter.unit ? ` ${meter.unit}` : ''}
                      </span>
                    ) : null}{' '}
                    <span className={layout.muted}>
                      {t('widget.detail', { tenants, events: formatQuantity(events, locale) })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className={layout.muted}>
            {summary.data?.next_cursor
              ? t('widget.sampled', { count: SAMPLE })
              : t('widget.thisMonthNote')}
          </p>
        </div>
      )}
    </Card>
  );
}

function BillingWidget({ productId }: { productId: string }) {
  const { t } = useTranslation('billing');
  const plans = useQuery({
    queryKey: usageBillingKeys.plans(productId),
    queryFn: () => billingApi.plans(productId),
  });
  const subs = useQuery({
    queryKey: usageBillingKeys.subscriptions(productId, { limit: SAMPLE }),
    queryFn: () => billingApi.subscriptions(productId, { limit: SAMPLE }),
  });
  const failed = plans.error ?? subs.error;
  const counts = new Map<string, number>();
  for (const sub of subs.data?.items ?? [])
    counts.set(sub.status, (counts.get(sub.status) ?? 0) + 1);
  return (
    <Card
      title={
        <span>
          <CreditCard aria-hidden width={18} height={18} /> {t('widget.title')}
        </span>
      }
      actions={
        <ButtonLink
          to={`/p/${encodeURIComponent(productId)}/subscriptions`}
          size="sm"
          variant="ghost"
        >
          {t('widget.open')}
        </ButtonLink>
      }
    >
      {failed ? (
        <ErrorState
          error={failed}
          onRetry={() => {
            void plans.refetch();
            void subs.refetch();
          }}
          compact
          headingLevel={3}
        />
      ) : plans.isPending || subs.isPending ? (
        <Skeleton height={80} />
      ) : (
        <div className={layout.stack}>
          <p className={layout.muted}>
            {t('widget.plans', {
              count: (plans.data ?? []).filter((plan) => plan.active).length,
              total: plans.data?.length ?? 0,
            })}
          </p>
          <ul className={styles.widgetList} aria-label={t('widget.byStatus')}>
            {SUBSCRIPTION_STATUSES.filter((status) => status !== 'canceled').map((status) => (
              <li key={status} className={styles.widgetRow}>
                <Badge tone={statusTone(status)}>{t(`status.${status}`)}</Badge>
                <span className={styles.widgetValue}>{counts.get(status) ?? 0}</span>
              </li>
            ))}
          </ul>
          <p className={layout.muted}>
            {subs.data?.next_cursor
              ? t('widget.sampled', { count: SAMPLE })
              : t('widget.allCounted')}
          </p>
        </div>
      )}
    </Card>
  );
}
