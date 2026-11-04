import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  BarChart3,
  Ban,
  CreditCard,
  ExternalLink,
  Pencil,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { billingApi, tenantsApi, usageApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import type {
  CheckoutSession,
  Entitlements,
  Plan,
  Subscription,
  SubscriptionStatus,
} from '@/api/models';
import { queryKeys, usageBillingKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useMeta, useProductScope } from '@/app/contexts';
import { useCrumbLabel } from '@/app/crumbs';
import { isModuleEnabled } from '@/app/modules';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  DetailList,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  Select,
  Skeleton,
  Time,
  layout,
  useToast,
} from '@/components/ui';
import { SuspendedTenantGate } from '@/features/tenants/SuspendedTenantGate';
import { formatQuantity } from '@/features/usage/usage-utils';
import { HelpLink } from '@/help/HelpLink';
import { InfoTip } from '@/help/InfoTip';
import { useFormatters } from '@/lib/format';
import {
  daysUntil,
  entitlementMap,
  entitlementRows,
  formatMoney,
  statusTone,
  TRANSITIONS,
  validateEntitlements,
  type EntitlementRow,
} from './billing-utils';
import { EntitlementsEditor } from './EntitlementsEditor';
import { useBillingProvider, type BillingProviderState } from './useBillingProvider';
import styles from './billing.module.css';

type Confirm = 'cancelAtEnd' | 'cancelNow' | 'resume' | null;

export function TenantBillingPage() {
  const { t } = useTranslation('billing');
  const { tenantId = '' } = useParams();
  const { productId } = useProductScope();
  const meta = useMeta();
  const can = useCan();
  const scope = { tenantId };
  const canRead = can('billing:read', scope);
  const canManage = can('billing:manage', scope);
  const provider = useBillingProvider();
  const tenant = useQuery({
    queryKey: queryKeys.tenant(productId, tenantId),
    queryFn: () => tenantsApi.get(productId, tenantId),
  });
  useCrumbLabel(tenant.data?.name);
  const title = tenant.data?.name ?? tenantId;

  if (!canRead) {
    return (
      <div className={layout.stack}>
        <PageHeader title={title} documentTitle={t('tenant.title')} help="plans-subscriptions" />
        <EmptyState title={t('noAccess')} description={t('noAccessBody')} />
      </div>
    );
  }

  return (
    <div className={layout.stack}>
      <PageHeader
        title={title}
        documentTitle={t('tenant.title')}
        description={t('tenant.description')}
        help="plans-subscriptions"
        meta={<code className={layout.mono}>{tenantId}</code>}
        actions={
          isModuleEnabled(meta.modules, 'usage') && can('usage:read', scope) ? (
            <ButtonLink
              to={`/p/${encodeURIComponent(productId)}/usage?tab=tenant&tenant=${encodeURIComponent(tenantId)}`}
              icon={<BarChart3 />}
            >
              {t('tenant.usage')}
            </ButtonLink>
          ) : null
        }
      />
      <SuspendedTenantGate productId={productId} tenantId={tenantId} permission="billing:read">
        <TenantSubscription
          productId={productId}
          tenantId={tenantId}
          canManage={canManage}
          provider={provider}
        />
        <EntitlementsCard productId={productId} tenantId={tenantId} canManage={canManage} />
      </SuspendedTenantGate>
    </div>
  );
}

/** The subscription card; mounted only while the tenant's data is open (see SuspendedTenantGate). */
function TenantSubscription({
  productId,
  tenantId,
  canManage,
  provider,
}: {
  productId: string;
  tenantId: string;
  canManage: boolean;
  provider: BillingProviderState;
}) {
  const subscription = useQuery({
    queryKey: usageBillingKeys.subscription(productId, tenantId),
    queryFn: async () => {
      try {
        return await billingApi.subscription(productId, tenantId);
      } catch (error) {
        if (isApiError(error) && error.isNotFound) return null;
        throw error;
      }
    },
  });
  if (subscription.isPending) return <Skeleton height={200} radius={12} />;
  if (subscription.isError) {
    return <ErrorState error={subscription.error} onRetry={() => void subscription.refetch()} />;
  }
  return (
    <SubscriptionCard
      productId={productId}
      tenantId={tenantId}
      subscription={subscription.data}
      canManage={canManage}
      provider={provider}
    />
  );
}

function SubscriptionCard({
  productId,
  tenantId,
  subscription,
  canManage,
  provider,
}: {
  productId: string;
  tenantId: string;
  subscription: Subscription | null;
  canManage: boolean;
  provider: BillingProviderState;
}) {
  const { t } = useTranslation('billing');
  const { locale, dateTime } = useFormatters();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<'subscribe' | 'change' | 'status' | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null);
  const refresh = (updated?: Subscription) => {
    if (updated)
      queryClient.setQueryData(usageBillingKeys.subscription(productId, tenantId), updated);
    void queryClient.invalidateQueries({ queryKey: ['products', productId, 'billing'] });
    void queryClient.invalidateQueries({
      queryKey: usageBillingKeys.tenantUsage(productId, tenantId),
    });
  };
  const current = subscription && subscription.status !== 'canceled' ? subscription : null;
  const trialDays = current?.status === 'trialing' ? daysUntil(current.trial_end) : null;
  const transitions = current ? (TRANSITIONS[current.status as SubscriptionStatus] ?? []) : [];

  const runConfirm = async () => {
    try {
      let updated: Subscription;
      if (confirm === 'resume') updated = await billingApi.resume(productId, tenantId);
      else updated = await billingApi.cancel(productId, tenantId, confirm === 'cancelAtEnd');
      toast.success(
        confirm === 'resume'
          ? t('subscription.resumed')
          : confirm === 'cancelAtEnd'
            ? t('subscription.cancelScheduled')
            : t('subscription.canceled'),
      );
      refresh(updated);
    } catch (error) {
      showError(error);
      throw error;
    }
  };

  return (
    <Card
      title={t('subscription.title')}
      accent
      actions={
        canManage ? (
          current ? (
            <>
              {current.provider !== 'stripe' && current.status !== 'incomplete' ? (
                <Button size="sm" icon={<ArrowLeftRight />} onClick={() => setDialog('change')}>
                  {t('subscription.changePlan')}
                </Button>
              ) : null}
              {current.provider === 'manual' && transitions.length > 0 ? (
                <Button size="sm" icon={<Pencil />} onClick={() => setDialog('status')}>
                  {t('subscription.setStatus')}
                </Button>
              ) : null}
              {current.cancel_at_period_end ? (
                <Button size="sm" icon={<RotateCcw />} onClick={() => setConfirm('resume')}>
                  {t('subscription.resume')}
                </Button>
              ) : current.status !== 'incomplete' ? (
                <Button size="sm" icon={<Ban />} onClick={() => setConfirm('cancelAtEnd')}>
                  {t('subscription.cancelAtEnd')}
                </Button>
              ) : null}
              <Button size="sm" variant="danger" onClick={() => setConfirm('cancelNow')}>
                {t('subscription.cancelNow')}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="primary"
              icon={<Play />}
              onClick={() => setDialog('subscribe')}
            >
              {t('subscription.subscribe')}
            </Button>
          )
        ) : null
      }
    >
      {!subscription ? (
        <EmptyState
          compact
          headingLevel={3}
          icon={<CreditCard />}
          title={t('subscription.none')}
          description={canManage ? t('subscription.noneBody') : undefined}
        />
      ) : (
        <div className={layout.stack}>
          {subscription.status === 'canceled' ? (
            <Alert tone="info">{t('subscription.canceledNotice')}</Alert>
          ) : null}
          {trialDays !== null ? (
            <Alert tone="info">
              {t('subscription.trialNotice', {
                count: trialDays,
                date: dateTime(subscription.trial_end),
              })}
            </Alert>
          ) : null}
          {current?.cancel_at_period_end ? (
            <Alert tone="warning">
              {t('subscription.endsNotice', { date: dateTime(current.current_period_end) })}
            </Alert>
          ) : null}
          {current?.status === 'past_due' ? (
            <Alert tone="warning">
              {t('subscription.pastDueNotice')}{' '}
              <HelpLink topic="plans-subscriptions#status">{t('common:help.learnMore')}</HelpLink>
            </Alert>
          ) : null}
          {current?.status === 'incomplete' ? (
            <Alert tone="warning">{t('subscription.incompleteNotice')}</Alert>
          ) : null}
          <DetailList
            columns={2}
            items={[
              { label: t('subscriptions.plan'), value: subscription.plan_key, mono: true },
              {
                label: t('subscriptions.status'),
                value: (
                  <Badge tone={statusTone(subscription.status)}>
                    {t(`status.${subscription.status}`, { defaultValue: subscription.status })}
                  </Badge>
                ),
              },
              {
                label: t('subscriptions.price'),
                value:
                  subscription.price && subscription.price.amount_minor > 0 ? (
                    <span className={styles.money}>
                      {t('prices.per', {
                        amount: formatMoney(
                          subscription.price.amount_minor,
                          subscription.price.currency,
                          locale,
                        ),
                        interval: t(`interval.${subscription.price.interval}`, {
                          defaultValue: subscription.price.interval,
                        }),
                      })}
                    </span>
                  ) : (
                    t('plans.free')
                  ),
              },
              {
                label: t('subscription.period'),
                value: t('subscription.periodRange', {
                  from: dateTime(subscription.current_period_start),
                  to: dateTime(subscription.current_period_end),
                }),
              },
              {
                label: t('subscriptions.trialEnd'),
                value: <Time value={subscription.trial_end} mode="absolute" />,
              },
              {
                label: t('subscription.cancelAtPeriodEnd'),
                value: subscription.cancel_at_period_end ? t('yes') : t('no'),
              },
              subscription.canceled_at
                ? {
                    label: t('subscription.canceledAt'),
                    value: <Time value={subscription.canceled_at} mode="absolute" />,
                  }
                : null,
              {
                label: t('subscriptions.provider'),
                value: t(`provider.names.${subscription.provider}`, {
                  defaultValue: subscription.provider,
                }),
              },
              subscription.provider_customer_id
                ? {
                    label: t('subscription.providerCustomer'),
                    value: subscription.provider_customer_id,
                    mono: true,
                  }
                : null,
              subscription.provider_subscription_id
                ? {
                    label: t('subscription.providerSubscription'),
                    value: subscription.provider_subscription_id,
                    mono: true,
                  }
                : null,
              { label: t('subscription.id'), value: subscription.id, mono: true },
            ]}
          />
          {current?.provider === 'stripe' ? (
            <p className={layout.muted}>{t('subscription.stripeManaged')}</p>
          ) : null}
        </div>
      )}
      {dialog === 'subscribe' || dialog === 'change' ? (
        <PlanChoiceDialog
          productId={productId}
          tenantId={tenantId}
          mode={dialog}
          subscription={current}
          provider={provider}
          onClose={() => setDialog(null)}
          onDone={(result) => {
            setDialog(null);
            if ('checkout_id' in result) {
              refresh(result.subscription);
              if (result.completed || !result.url) toast.success(t('subscription.subscribed'));
              else setCheckout(result);
            } else {
              toast.success(
                dialog === 'change' ? t('subscription.planChanged') : t('subscription.subscribed'),
              );
              refresh(result);
            }
          }}
        />
      ) : null}
      {dialog === 'status' && current ? (
        <StatusDialog
          productId={productId}
          tenantId={tenantId}
          subscription={current}
          options={transitions}
          onClose={() => setDialog(null)}
          onDone={(updated) => {
            setDialog(null);
            toast.success(t('subscription.statusSet'));
            refresh(updated);
          }}
        />
      ) : null}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => (open ? undefined : setConfirm(null))}
        tone={confirm === 'resume' ? 'primary' : 'danger'}
        title={t(`subscription.confirm.${confirm ?? 'cancelAtEnd'}.title`)}
        description={
          <>
            {t(`subscription.confirm.${confirm ?? 'cancelAtEnd'}.body`, {
              plan: current?.plan_key,
              date: dateTime(current?.current_period_end),
            })}{' '}
            <HelpLink topic="plans-subscriptions#cancel">{t('common:help.learnMore')}</HelpLink>
          </>
        }
        confirmLabel={t(`subscription.confirm.${confirm ?? 'cancelAtEnd'}.action`)}
        confirmText={confirm === 'cancelNow' ? current?.plan_key : undefined}
        onConfirm={runConfirm}
      />
      <Dialog
        open={checkout !== null}
        onOpenChange={(open) => (open ? undefined : setCheckout(null))}
        title={t('checkout.readyTitle')}
        description={t('checkout.readyBody', {
          provider: t(`provider.names.${checkout?.provider ?? ''}`, {
            defaultValue: checkout?.provider ?? '',
          }),
        })}
        footer={
          <Button variant="ghost" onClick={() => setCheckout(null)}>
            {t('common:actions.close')}
          </Button>
        }
      >
        {checkout?.url ? (
          <a className={layout.link} href={checkout.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden width={16} height={16} /> {t('checkout.open')}
            <span className="ax-sr-only"> ({t('checkout.newTab')})</span>
          </a>
        ) : null}
      </Dialog>
    </Card>
  );
}

function PlanChoiceDialog({
  productId,
  tenantId,
  mode,
  subscription,
  provider,
  onClose,
  onDone,
}: {
  productId: string;
  tenantId: string;
  mode: 'subscribe' | 'change';
  subscription: Subscription | null;
  provider: BillingProviderState;
  onClose: () => void;
  onDone: (result: Subscription | CheckoutSession) => void;
}) {
  const { t } = useTranslation('billing');
  const { locale } = useFormatters();
  const showError = useErrorToast();
  const plans = useQuery({
    queryKey: usageBillingKeys.tenantPlans(productId, tenantId),
    queryFn: () => billingApi.tenantPlans(productId, tenantId),
  });
  const [planKey, setPlanKey] = useState('');
  const [priceId, setPriceId] = useState('');
  const list = (plans.data ?? []).filter((plan) => plan.active);
  const plan: Plan | undefined = list.find((item) => item.key === planKey);
  const price = plan?.prices.find((item) => item.id === priceId) ?? plan?.prices[0];
  const paid = Boolean(price && price.amount_minor > 0);
  // Paid plans need the provider's hosted checkout unless the provider is manual (BILLING.md).
  const needsCheckout =
    paid &&
    provider.status === 'known' &&
    provider.provider !== 'manual' &&
    (mode === 'subscribe' || subscription?.provider === 'manual');
  // Plan changes never start a checkout; a paid upgrade of a manual subscription needs one.
  const blocked = needsCheckout && (mode === 'change' || !provider.checkoutAvailable);

  const submit = useMutation({
    mutationFn: async (): Promise<Subscription | CheckoutSession> => {
      if (!plan) throw new Error('no plan');
      const chosenPrice = price?.id ?? null;
      if (needsCheckout && mode === 'subscribe') {
        // Return to this page; the API accepts only its own public URL or allowed origins.
        const back = window.location.href.split('?')[0] ?? window.location.href;
        return billingApi.checkout(productId, tenantId, {
          plan: plan.key,
          price_id: chosenPrice,
          success_url: `${back}?checkout=success`,
          cancel_url: `${back}?checkout=cancel`,
        });
      }
      if (mode === 'change') {
        return billingApi.changePlan(
          productId,
          tenantId,
          plan.key,
          chosenPrice,
          subscription?.version,
        );
      }
      return billingApi.subscribe(productId, tenantId, plan.key, chosenPrice);
    },
    onSuccess: onDone,
    onError: showError,
  });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (plan && !blocked) submit.mutate();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={mode === 'change' ? t('subscription.changePlan') : t('subscription.subscribe')}
      description={
        <>
          {mode === 'change'
            ? t('subscription.changeDescription', { plan: subscription?.plan_key })
            : t('subscription.subscribeDescription')}{' '}
          <HelpLink
            topic={
              mode === 'change'
                ? 'plans-subscriptions#change-plan'
                : 'plans-subscriptions#subscribe'
            }
          >
            {t('common:help.learnMore')}
          </HelpLink>
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="plan-choice-form"
            variant="primary"
            loading={submit.isPending}
            disabled={
              !plan ||
              blocked ||
              (mode === 'change' &&
                plan.key === subscription?.plan_key &&
                (price?.id ?? null) === (subscription?.price?.id ?? null))
            }
          >
            {needsCheckout && mode === 'subscribe'
              ? t('checkout.start')
              : mode === 'change'
                ? t('subscription.changeSubmit')
                : t('subscription.subscribeSubmit')}
          </Button>
        </>
      }
    >
      <form id="plan-choice-form" className={layout.form} onSubmit={onSubmit}>
        {plans.isError ? (
          <ErrorState
            error={plans.error}
            onRetry={() => void plans.refetch()}
            compact
            headingLevel={3}
          />
        ) : (
          <FormField label={t('subscriptions.plan')} required>
            <Select
              value={planKey}
              onChange={(event) => {
                setPlanKey(event.target.value);
                setPriceId('');
              }}
              disabled={plans.isPending}
            >
              <option value="" disabled>
                {plans.isPending ? t('common:states.loading') : t('subscription.choosePlan')}
              </option>
              {list.map((item) => (
                <option key={item.id} value={item.key}>
                  {item.name} ({item.key})
                </option>
              ))}
            </Select>
          </FormField>
        )}
        {plan && plan.prices.length > 1 ? (
          <FormField label={t('subscription.price')}>
            <Select value={price?.id ?? ''} onChange={(event) => setPriceId(event.target.value)}>
              {plan.prices.map((item) => (
                <option key={item.id} value={item.id}>
                  {t('prices.per', {
                    amount: formatMoney(item.amount_minor, item.currency, locale),
                    interval: t(`interval.${item.interval}`, { defaultValue: item.interval }),
                  })}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}
        {plan ? (
          <DetailList
            items={[
              {
                label: t('subscriptions.price'),
                value:
                  price && price.amount_minor > 0
                    ? t('prices.per', {
                        amount: formatMoney(price.amount_minor, price.currency, locale),
                        interval: t(`interval.${price.interval}`, { defaultValue: price.interval }),
                      })
                    : t('plans.free'),
              },
              {
                label: t('plans.trial'),
                value:
                  plan.trial_days > 0
                    ? t('plans.trialValue', { count: plan.trial_days })
                    : t('plans.noTrial'),
              },
            ]}
          />
        ) : null}
        {needsCheckout && !blocked && mode === 'subscribe' ? (
          <Alert tone="info">{t('checkout.explain')}</Alert>
        ) : null}
        {blocked ? (
          <Alert tone="warning">
            {mode === 'change'
              ? t('checkout.changeNeedsCheckout')
              : provider.livePayments
                ? t('checkout.liveBlocked')
                : t('checkout.unavailable')}
          </Alert>
        ) : null}
        {paid && provider.status === 'known' && provider.provider === 'manual' ? (
          <Alert tone="info">{t('subscription.manualPaid')}</Alert>
        ) : null}
      </form>
    </Dialog>
  );
}

function StatusDialog({
  productId,
  tenantId,
  subscription,
  options,
  onClose,
  onDone,
}: {
  productId: string;
  tenantId: string;
  subscription: Subscription;
  options: SubscriptionStatus[];
  onClose: () => void;
  onDone: (subscription: Subscription) => void;
}) {
  const { t } = useTranslation('billing');
  const showError = useErrorToast();
  const [status, setStatus] = useState<SubscriptionStatus>(options[0] ?? 'active');
  const save = useMutation({
    mutationFn: () => billingApi.setStatus(productId, tenantId, status, subscription.version),
    onSuccess: onDone,
    onError: showError,
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t('subscription.setStatus')}
      description={
        <>
          {t('subscription.statusDescription', {
            status: t(`status.${subscription.status}`, { defaultValue: subscription.status }),
          })}{' '}
          <HelpLink topic="plans-subscriptions#set-status">{t('common:help.learnMore')}</HelpLink>
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant={status === 'canceled' ? 'danger' : 'primary'}
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            {t('subscription.statusSubmit')}
          </Button>
        </>
      }
    >
      <FormField label={t('subscription.newStatus')}>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as SubscriptionStatus)}
        >
          {options.map((value) => (
            <option key={value} value={value}>
              {t(`status.${value}`)}
            </option>
          ))}
        </Select>
      </FormField>
    </Dialog>
  );
}

function EntitlementsCard({
  productId,
  tenantId,
  canManage,
}: {
  productId: string;
  tenantId: string;
  canManage: boolean;
}) {
  const { t } = useTranslation('billing');
  const { locale } = useFormatters();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const query = useQuery({
    queryKey: usageBillingKeys.entitlements(productId, tenantId),
    queryFn: () => billingApi.entitlements(productId, tenantId),
  });
  const data = query.data;
  const features = Object.entries(data?.features ?? {});
  const limits = Object.entries(data?.limits ?? {});
  const overrides = Object.entries(data?.overrides ?? {});
  const limitText = (value: unknown) =>
    value === null || value === undefined
      ? t('entitlements.unlimited')
      : typeof value === 'number'
        ? formatQuantity(value, locale)
        : String(value);

  return (
    <Card
      title={t('entitlements.effectiveTitle')}
      description={
        <>
          {t('entitlements.effectiveDescription')}{' '}
          <InfoTip label={t('info.entitlementsLabel')} topic="plans-subscriptions#overrides">
            {t('info.entitlements')}
          </InfoTip>
        </>
      }
      actions={
        canManage && data ? (
          <Button size="sm" icon={<Pencil />} onClick={() => setEditing(true)}>
            {t('entitlements.editOverrides')}
          </Button>
        ) : null
      }
    >
      {query.isPending ? (
        <Skeleton height={100} />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          onRetry={() => void query.refetch()}
          compact
          headingLevel={3}
        />
      ) : (
        <DetailList
          items={[
            {
              label: t('entitlements.source'),
              value: data?.plan_key ? (
                <span className={layout.tags}>
                  <code>{data.plan_key}</code>
                  {data.subscription_status ? (
                    <Badge tone={statusTone(data.subscription_status)}>
                      {t(`status.${data.subscription_status}`)}
                    </Badge>
                  ) : null}
                </span>
              ) : (
                t('entitlements.noPlan')
              ),
            },
            {
              label: t('entitlements.features'),
              value: features.length ? (
                <span className={layout.tags}>
                  {features.map(([name, on]) => (
                    <Badge key={name} tone={on ? 'success' : 'neutral'}>
                      {name}: {on ? t('entitlements.on') : t('entitlements.off')}
                    </Badge>
                  ))}
                </span>
              ) : (
                t('entitlements.noneSet')
              ),
            },
            {
              label: t('entitlements.limits'),
              value: limits.length ? (
                <ul className={styles.widgetList}>
                  {limits.map(([meter, value]) => (
                    <li key={meter} className={styles.widgetRow}>
                      <code>{meter}</code>
                      <span>{limitText(value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                t('entitlements.noneSet')
              ),
            },
            {
              label: t('entitlements.overrides'),
              value: overrides.length ? (
                <span className={layout.tags}>
                  {overrides.map(([key, value]) => (
                    <Badge key={key} tone="warning">
                      <code>{key}</code>:{' '}
                      {typeof value === 'boolean'
                        ? value
                          ? t('entitlements.on')
                          : t('entitlements.off')
                        : limitText(value)}
                    </Badge>
                  ))}
                </span>
              ) : (
                t('entitlements.noOverrides')
              ),
            },
          ]}
        />
      )}
      {editing && data ? (
        <OverridesDialog
          productId={productId}
          tenantId={tenantId}
          entitlements={data}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setEditing(false);
            queryClient.setQueryData(usageBillingKeys.entitlements(productId, tenantId), updated);
            void queryClient.invalidateQueries({
              queryKey: usageBillingKeys.tenantUsage(productId, tenantId),
            });
            toast.success(t('entitlements.overridesSaved'));
          }}
        />
      ) : null}
    </Card>
  );
}

function OverridesDialog({
  productId,
  tenantId,
  entitlements,
  onClose,
  onSaved,
}: {
  productId: string;
  tenantId: string;
  entitlements: Entitlements;
  onClose: () => void;
  onSaved: (entitlements: Entitlements) => void;
}) {
  const { t } = useTranslation('billing');
  const meta = useMeta();
  const can = useCan();
  const showError = useErrorToast();
  const [rows, setRows] = useState<EntitlementRow[]>(() => entitlementRows(entitlements.overrides));
  const problems = validateEntitlements(rows);
  const meters = useQuery({
    queryKey: usageBillingKeys.meters(productId),
    queryFn: () => usageApi.meters(productId),
    enabled: isModuleEnabled(meta.modules, 'usage') && can('usage:read'),
  });
  const save = useMutation({
    mutationFn: () => billingApi.setOverrides(productId, tenantId, entitlementMap(rows)),
    onSuccess: onSaved,
    onError: showError,
  });
  return (
    <Dialog
      open
      size="lg"
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t('entitlements.editOverrides')}
      description={
        <>
          {t('entitlements.overridesDescription')}{' '}
          <HelpLink topic="plans-subscriptions#overrides">{t('common:help.learnMore')}</HelpLink>
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            loading={save.isPending}
            disabled={Object.keys(problems).length > 0}
            onClick={() => save.mutate()}
          >
            {t('entitlements.saveOverrides')}
          </Button>
        </>
      }
    >
      <EntitlementsEditor
        legend={t('entitlements.overrides')}
        rows={rows}
        onChange={setRows}
        problems={problems}
        meterKeys={(meters.data ?? []).map((meter) => meter.key)}
      />
    </Dialog>
  );
}
