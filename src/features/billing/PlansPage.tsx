import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Plus, Power, Receipt, ShieldOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { billingApi } from '@/api/endpoints';
import type { Plan } from '@/api/models';
import { usageBillingKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  PageHeader,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import menuStyles from '@/components/ui/IconButton.module.css';
import { HelpLink } from '@/help/HelpLink';
import { useFormatters } from '@/lib/format';
import { formatQuantity } from '@/features/usage/usage-utils';
import { formatMoney } from './billing-utils';
import { PlanFormDialog } from './PlanFormDialog';
import { ProviderStatusCard } from './ProviderStatusCard';
import { useBillingProvider } from './useBillingProvider';
import styles from './billing.module.css';

export function PlansPage() {
  const { t } = useTranslation('billing');
  const { productId } = useProductScope();
  const { locale } = useFormatters();
  const can = useCan();
  const canRead = can('billing:read');
  const canManage = can('billing:manage');
  const provider = useBillingProvider();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const creating = searchParams.get('new') === '1' && canManage;
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const plans = useQuery({
    queryKey: usageBillingKeys.plans(productId),
    queryFn: () => billingApi.plans(productId),
    enabled: canRead,
  });
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['products', productId, 'billing'] });
  const setCreating = (open: boolean) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (open) next.set('new', '1');
        else next.delete('new');
        return next;
      },
      { replace: true },
    );

  const toggle = useMutation({
    mutationFn: (plan: Plan) =>
      billingApi.updatePlan(productId, plan.id, { active: !plan.active }, plan.version),
    onSuccess: (plan) => {
      toast.success(
        plan.active
          ? t('plans.activated', { name: plan.name })
          : t('plans.deactivated', { name: plan.name }),
      );
      void invalidate();
    },
    onError: showError,
  });

  if (!canRead) {
    return (
      <div className={layout.stack}>
        <PageHeader
          title={t('plans.title')}
          description={t('plans.description')}
          help="plans-subscriptions"
        />
        <EmptyState icon={<ShieldOff />} title={t('noAccess')} description={t('noAccessBody')} />
      </div>
    );
  }

  const columns: Column<Plan>[] = [
    {
      id: 'name',
      header: t('plans.name'),
      rowHeader: true,
      cell: (plan) => (
        <span className={layout.cellStack}>
          <span>{plan.name}</span>
          <code className={layout.muted}>{plan.key}</code>
        </span>
      ),
    },
    {
      id: 'prices',
      header: t('plans.prices'),
      cell: (plan) =>
        plan.free || plan.prices.length === 0 ? (
          <Badge tone="success">{t('plans.free')}</Badge>
        ) : (
          <ul className={styles.priceList}>
            {plan.prices.map((price) => (
              <li key={price.id} className={styles.money}>
                {t('prices.per', {
                  amount: formatMoney(price.amount_minor, price.currency, locale),
                  interval: t(`interval.${price.interval}`, { defaultValue: price.interval }),
                })}
              </li>
            ))}
          </ul>
        ),
    },
    {
      id: 'trial',
      header: t('plans.trial'),
      hideOnMobile: true,
      cell: (plan) =>
        plan.trial_days > 0
          ? t('plans.trialValue', { count: plan.trial_days })
          : t('plans.noTrial'),
    },
    {
      id: 'entitlements',
      header: t('plans.entitlements'),
      hideOnMobile: true,
      cell: (plan) => {
        const entries = Object.entries(plan.entitlements ?? {});
        if (entries.length === 0) return '—';
        return (
          <span className={layout.tags}>
            {entries.map(([key, value]) => (
              <Badge key={key} tone={value === false ? 'neutral' : 'info'}>
                <code>{key}</code>
                {typeof value === 'number'
                  ? `: ${formatQuantity(value, locale)}`
                  : value === null
                    ? `: ${t('entitlements.unlimited')}`
                    : value
                      ? ''
                      : `: ${t('entitlements.off')}`}
              </Badge>
            ))}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: t('plans.status'),
      cell: (plan) =>
        plan.active ? (
          <Badge tone="success">{t('plans.active')}</Badge>
        ) : (
          <Badge>{t('plans.inactive')}</Badge>
        ),
    },
  ];
  if (canManage) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (plan) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`${menuStyles.iconButton} ${menuStyles.sm}`}
            aria-label={t('plans.actionsFor', { name: plan.name })}
          >
            <MoreHorizontal aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Pencil />} onSelect={() => setEditing(plan)}>
              {t('plans.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Power />} onSelect={() => toggle.mutate(plan)}>
              {plan.active ? t('plans.deactivate') : t('plans.activate')}
            </DropdownMenuItem>
            <DropdownMenuItem tone="danger" icon={<Trash2 />} onSelect={() => setDeleting(plan)}>
              {t('plans.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('plans.title')}
        description={t('plans.description')}
        help="plans-subscriptions"
        actions={
          canManage ? (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              {t('plans.create')}
            </Button>
          ) : null
        }
      />
      <Card flush>
        <DataTable
          caption={t('plans.title')}
          columns={columns}
          rows={plans.data}
          getRowId={(plan) => plan.id}
          status={plans.status}
          error={plans.error}
          onRetry={() => void plans.refetch()}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<Receipt />}
              title={t('plans.empty')}
              description={
                canManage ? (
                  <>
                    {t('plans.emptyBody')}{' '}
                    <HelpLink topic="plans-subscriptions#create-plan">
                      {t('common:help.learnMore')}
                    </HelpLink>
                  </>
                ) : undefined
              }
            />
          }
        />
      </Card>
      <ProviderStatusCard state={provider} />
      {creating || editing ? (
        <PlanFormDialog
          productId={productId}
          plan={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={(plan, created) => {
            setEditing(null);
            setCreating(false);
            toast.success(
              created
                ? t('plans.created', { name: plan.name })
                : t('plans.saved', { name: plan.name }),
            );
            void invalidate();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title={t('plans.deleteTitle')}
        description={t('plans.deleteBody', { name: deleting?.name })}
        confirmLabel={t('plans.delete')}
        confirmText={deleting?.key}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await billingApi.deletePlan(productId, deleting.id, deleting.version);
            toast.success(t('plans.deleted', { name: deleting.name }));
            void invalidate();
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </div>
  );
}
