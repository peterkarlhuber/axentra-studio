import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';

export interface BillingProviderState {
  /** `unknown` when the caller may not read `/v1/settings` or it failed. */
  status: 'loading' | 'known' | 'unknown';
  provider: string | null;
  livePayments: boolean;
  /**
   * A hosted checkout may be offered: the API reports a payment provider (fake or stripe) and
   * live payments are off. Studio never takes payment details itself.
   */
  checkoutAvailable: boolean;
  error: unknown;
}

/**
 * Billing provider as reported by `GET /v1/settings` (`billing.provider`, `billing.live_payments`).
 * The endpoint needs `platform:settings` or `product:manage`; others get `unknown`.
 */
export function useBillingProvider(): BillingProviderState {
  const can = useCan();
  const allowed = can('platform:settings') || can('product:manage');
  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
    enabled: allowed,
    staleTime: 5 * 60_000,
  });
  if (!allowed || query.isError) {
    return {
      status: 'unknown',
      provider: null,
      livePayments: false,
      checkoutAvailable: false,
      error: query.error,
    };
  }
  if (query.isPending) {
    return {
      status: 'loading',
      provider: null,
      livePayments: false,
      checkoutAvailable: false,
      error: null,
    };
  }
  const billing = (query.data.billing ?? {}) as { provider?: unknown; live_payments?: unknown };
  const provider = typeof billing.provider === 'string' ? billing.provider : null;
  const livePayments = billing.live_payments === true;
  return {
    status: provider ? 'known' : 'unknown',
    provider,
    livePayments,
    checkoutAvailable: Boolean(provider && provider !== 'manual' && !livePayments),
    error: null,
  };
}
