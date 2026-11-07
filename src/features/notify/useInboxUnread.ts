import { useQuery } from '@tanstack/react-query';
import { notifyApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useMe } from '@/app/auth';
import { useMeta } from '@/app/contexts';
import { isModuleEnabled } from '@/app/modules';

/** How often the unread count is refreshed while Studio is open. */
export const INBOX_REFRESH_MS = 60_000;

/**
 * The signed-in user's unread in-app notifications in a product (`.../notify/inbox/me/unread`),
 * product-wide or in one tenant. Only for users (an API key has no inbox) and only with the
 * notify module; refreshed every minute and after "mark as read".
 */
export function useInboxUnread(productId: string | null | undefined, tenantId?: string) {
  const meta = useMeta();
  const { data: me } = useMe();
  const enabled =
    Boolean(productId) &&
    isModuleEnabled(meta.modules, 'notifications') &&
    me?.actor_kind === 'user';
  return useQuery({
    queryKey: queryKeys.notifyInboxUnread(productId ?? '', tenantId),
    queryFn: () => notifyApi.inboxUnread(productId ?? '', tenantId),
    enabled,
    retry: false,
    staleTime: 30_000,
    refetchInterval: enabled ? INBOX_REFRESH_MS : false,
  });
}
