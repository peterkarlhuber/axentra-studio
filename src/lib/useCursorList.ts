import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import type { Page } from '@/api/models';

/**
 * Cursor pagination (`limit` + `cursor` -> `{items, next_cursor}`) as an infinite query,
 * plus the props DataTable needs for loading/error/empty states and "Load more".
 */
export function useCursorList<T>(
  queryKey: QueryKey,
  fetchPage: (cursor: string | null) => Promise<Page<T>>,
  options: { enabled?: boolean } = {},
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled: options.enabled ?? true,
  });
  const rows = query.data?.pages.flatMap((page) => page.items ?? []);
  return {
    query,
    rows,
    tableProps: {
      rows,
      status: query.status,
      error: query.error,
      onRetry: () => void query.refetch(),
      hasNextPage: query.hasNextPage,
      isFetchingNextPage: query.isFetchingNextPage,
      onLoadMore: () => void query.fetchNextPage(),
      isRefreshing: query.isRefetching,
    },
  };
}
