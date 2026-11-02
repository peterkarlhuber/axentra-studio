import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Card, DetailList, Skeleton } from '@/components/ui';
import type { BillingProviderState } from './useBillingProvider';

/** What the API reports about the payment provider; Studio itself never handles card data. */
export function ProviderStatusCard({ state }: { state: BillingProviderState }) {
  const { t } = useTranslation('billing');
  return (
    <Card
      title={
        <span>
          <CreditCard aria-hidden width={18} height={18} /> {t('provider.title')}
        </span>
      }
      description={t('provider.noCardData')}
    >
      {state.status === 'loading' ? (
        <Skeleton height={60} />
      ) : state.status === 'unknown' ? (
        <Alert tone="info">{t('provider.unknown')}</Alert>
      ) : (
        <DetailList
          items={[
            {
              label: t('provider.provider'),
              value: (
                <Badge tone={state.provider === 'stripe' ? 'brand' : 'neutral'}>
                  {t(`provider.names.${state.provider}`, { defaultValue: state.provider ?? '' })}
                </Badge>
              ),
            },
            {
              label: t('provider.livePayments'),
              value: state.livePayments ? (
                <Badge tone="warning">{t('provider.liveOn')}</Badge>
              ) : (
                <Badge>{t('provider.liveOff')}</Badge>
              ),
            },
            {
              label: t('provider.behaviour'),
              value: t(`provider.explain.${state.provider}`, {
                defaultValue: t('provider.explain.other'),
              }),
            },
            {
              label: t('provider.checkout'),
              value: state.checkoutAvailable
                ? t('provider.checkoutHosted')
                : state.livePayments
                  ? t('provider.checkoutLive')
                  : t('provider.checkoutNone'),
            },
          ]}
        />
      )}
    </Card>
  );
}
