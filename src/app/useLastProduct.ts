import { useMe } from './auth';
import { singleProductId, useMeta } from './contexts';
import { readPreference } from '@/lib/storage';

/**
 * The product to use outside `/p/:productId` routes: single-product mode's product, else
 * the last visited product the user still has, else the user's first product.
 */
export function useLastProductId(): string | null {
  const meta = useMeta();
  const { data: me } = useMe();
  const single = singleProductId(meta);
  if (single) return single;
  const stored = readPreference('lastProductId');
  if (
    stored &&
    (!me || me.products.some((entry) => entry.product.id === stored) || me.platform_role)
  ) {
    return stored;
  }
  return me?.products[0]?.product.id ?? null;
}
