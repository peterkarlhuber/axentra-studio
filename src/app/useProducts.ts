import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/endpoints';
import type { Product } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useSession } from './auth';

/** Products visible to the caller (`GET /v1/products`), shared by switcher and filters. */
export function useVisibleProducts() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: queryKeys.products(),
    queryFn: productsApi.list,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
}

/** Active products the user can switch between. */
export function useSwitchableProducts(): { products: Product[]; isLoading: boolean } {
  const query = useVisibleProducts();
  return {
    products: (query.data ?? []).filter((product) => product.status !== 'archived'),
    isLoading: query.isLoading,
  };
}
