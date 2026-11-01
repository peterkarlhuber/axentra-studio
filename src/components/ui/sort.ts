export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

/** Convert to the API `sort` parameter (`field` or `-field`). */
export function toSortParam(sort: SortState | null | undefined): string | undefined {
  if (!sort) return undefined;
  return sort.direction === 'desc' ? `-${sort.key}` : sort.key;
}
