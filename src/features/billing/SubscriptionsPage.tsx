import { useQuery } from '@tanstack/react-query';
import { CreditCard, ShieldOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { billingApi } from '@/api/endpoints';
import type { Subscription, SubscriptionStatus } from '@/api/models';
import { usageBillingKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useMeta, useProductScope } from '@/app/contexts';
import { isModuleEnabled } from '@/app/modules';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  FormField,
  PageHeader,
  Select,
  Time,
  layout,
  type Column,
} from '@/components/ui';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { useTenantNames } from '@/features/usage/useTenantNames';
import { HelpLink } from '@/help/HelpLink';
import { InfoTip } from '@/help/InfoTip';
import { useFormatters } from '@/lib/format';
import { useCursorList } from '@/lib/useCursorList';
import { formatMoney, statusTone, SUBSCRIPTION_STATUSES } from './billing-utils';
import { ProviderStatusCard } from './ProviderStatusCard';
import { useBillingProvider } from './useBillingProvider';
import styles from './billing.module.css';

export function SubscriptionsPage() {
  const { t } = useTranslation('billing');
  const { productId } = useProductScope();
  const meta = useMeta();
  const can = useCan();
  const navigate = useNavigate();
  const { locale } = useFormatters();
  const canRead = can('billing:read');
  const provider = useBillingProvider();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get('status') ?? '') as SubscriptionStatus | '';
  const plan = searchParams.get('plan') ?? '';
  const [tenantId, setTenantId] = useState('');
  const tenantsEnabled = isModuleEnabled(meta.modules, 'tenants');
  const tenantName = useTenantNames(productId, canRead && tenantsEnabled);
  const plans = useQuery({
    queryKey: usageBillingKeys.plans(productId),
    queryFn: () => billingApi.plans(productId),
    enabled: canRead,
  });
  const params = { status, plan };
  const list = useCursorList<Subscription>(
    usageBillingKeys.subscriptions(productId, params),
    (cursor) => billingApi.subscriptions(productId, { ...params, limit: 50, cursor }),
    { enabled: canRead },
  );
  const setFilter = (key: string, value: string) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  if (!canRead) {
    return (
      <div className={layout.stack}>
        <PageHeader
          title={t('subscriptions.title')}
          description={t('subscriptions.description')}
          help="plans-subscriptions#subscriptions"
        />
        <EmptyState icon={<ShieldOff />} title={t('noAccess')} description={t('noAccessBody')} />
      </div>
    );
  }

  const columns: Column<Subscription>[] = [
    {
      id: 'tenant',
      header: t('subscriptions.tenant'),
      rowHeader: true,
      cell: (sub) => (
        <Link className={layout.link} to={encodeURIComponent(sub.tenant_id)}>
          {tenantName(sub.tenant_id) ?? sub.tenant_id}
        </Link>
      ),
    },
    { id: 'plan', header: t('subscriptions.plan'), cell: (sub) => <code>{sub.plan_key}</code> },
    {
      id: 'status',
      header: (
        <span className={layout.tags}>
          {t('subscriptions.status')}
          <InfoTip label={t('info.statusLabel')} topic="plans-subscriptions#status">
            {t('info.status')}
          </InfoTip>
        </span>
      ),
      cell: (sub) => (
        <span className={layout.tags}>
          <Badge tone={statusTone(sub.status)}>
            {t(`status.${sub.status}`, { defaultValue: sub.status })}
          </Badge>
          {sub.cancel_at_period_end ? (
            <Badge tone="warning">{t('subscriptions.endsAtPeriodEnd')}</Badge>
          ) : null}
        </span>
      ),
    },
    {
      id: 'price',
      header: t('subscriptions.price'),
      hideOnMobile: true,
      cell: (sub) =>
        sub.price && sub.price.amount_minor > 0 ? (
          <span className={styles.money}>
            {t('prices.per', {
              amount: formatMoney(sub.price.amount_minor, sub.price.currency, locale),
              interval: t(`interval.${sub.price.interval}`, { defaultValue: sub.price.interval }),
            })}
          </span>
        ) : (
          t('plans.free')
        ),
    },
    {
      id: 'periodEnd',
      header: t('subscriptions.periodEnd'),
      hideOnMobile: true,
      cell: (sub) => <Time value={sub.current_period_end} mode="absolute" />,
    },
    {
      id: 'trialEnd',
      header: t('subscriptions.trialEnd'),
      hideOnMobile: true,
      cell: (sub) => <Time value={sub.trial_end} mode="absolute" />,
    },
    {
      id: 'provider',
      header: t('subscriptions.provider'),
      hideOnMobile: true,
      cell: (sub) => t(`provider.names.${sub.provider}`, { defaultValue: sub.provider }),
    },
  ];

  const openTenant = (event: FormEvent) => {
    event.preventDefault();
    if (tenantId) void navigate(encodeURIComponent(tenantId));
  };

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('subscriptions.title')}
        description={t('subscriptions.description')}
        help="plans-subscriptions#subscriptions"
      />
      {tenantsEnabled ? (
        <Card title={t('subscriptions.openTitle')} description={t('subscriptions.openDescription')}>
          <form className={layout.row} onSubmit={openTenant}>
            <TenantPicker productId={productId} value={tenantId} onChange={setTenantId} />
            <div>
              <Button type="submit" variant="primary" disabled={!tenantId}>
                {t('subscriptions.open')}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
      <Card flush title={t('subscriptions.listTitle')}>
        <div className={layout.toolbar}>
          <FormField label={t('subscriptions.filterStatus')}>
            <Select value={status} onChange={(event) => setFilter('status', event.target.value)}>
              <option value="">{t('subscriptions.allStatuses')}</option>
              {SUBSCRIPTION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(`status.${value}`)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t('subscriptions.filterPlan')}>
            <Select value={plan} onChange={(event) => setFilter('plan', event.target.value)}>
              <option value="">{t('subscriptions.allPlans')}</option>
              {(plans.data ?? []).map((item) => (
                <option key={item.id} value={item.key}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <DataTable
          caption={t('subscriptions.listTitle')}
          columns={columns}
          getRowId={(sub) => sub.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<CreditCard />}
              title={t('subscriptions.empty')}
              description={
                <>
                  {t('subscriptions.emptyBody')}{' '}
                  <HelpLink topic="plans-subscriptions#subscribe">
                    {t('common:help.learnMore')}
                  </HelpLink>
                </>
              }
            />
          }
          {...list.tableProps}
        />
      </Card>
      <ProviderStatusCard state={provider} />
    </div>
  );
}
