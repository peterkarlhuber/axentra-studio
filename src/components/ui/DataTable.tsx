import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Skeleton } from './Skeleton';
import type { SortState } from './sort';
import styles from './DataTable.module.css';

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Server sort field; makes the header a sort button. */
  sortKey?: string;
  align?: 'start' | 'end';
  /** Hide on narrow viewports (secondary information). */
  hideOnMobile?: boolean;
  /** Mark the cell as the row header (usually the name column). */
  rowHeader?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  status: 'pending' | 'error' | 'success';
  error?: unknown;
  onRetry?: () => void;
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  empty?: ReactNode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /** Refetch in progress while data is shown. */
  isRefreshing?: boolean;
  selectedRowId?: string | null;
  skeletonRows?: number;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  status,
  error,
  onRetry,
  sort,
  onSortChange,
  empty,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  isRefreshing,
  selectedRowId,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const { t } = useTranslation();

  if (status === 'error') {
    return <ErrorState error={error} onRetry={onRetry} compact headingLevel={3} />;
  }

  const nextSort = (key: string): SortState | null => {
    if (!sort || sort.key !== key) return { key, direction: 'asc' };
    if (sort.direction === 'asc') return { key, direction: 'desc' };
    return null;
  };

  const isEmpty = status === 'success' && (rows?.length ?? 0) === 0;

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.scroller}
        role="region"
        aria-label={caption}
        aria-busy={status === 'pending' || isRefreshing || undefined}
        tabIndex={0}
      >
        <table className={styles.table}>
          <caption className="ax-sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.sortKey;
                const ariaSort = column.sortKey
                  ? active
                    ? sort?.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={ariaSort}
                    style={{ width: column.width }}
                    className={clsx(
                      column.align === 'end' && styles.end,
                      column.hideOnMobile && styles.hideMobile,
                    )}
                  >
                    {column.sortKey && onSortChange ? (
                      <button
                        type="button"
                        className={clsx(styles.sortButton, active && styles.sortActive)}
                        onClick={() => onSortChange(nextSort(column.sortKey as string))}
                      >
                        {column.header}
                        {active ? (
                          sort?.direction === 'asc' ? (
                            <ArrowUp aria-hidden />
                          ) : (
                            <ArrowDown aria-hidden />
                          )
                        ) : (
                          <ArrowUpDown aria-hidden className={styles.sortIdle} />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {status === 'pending'
              ? Array.from({ length: skeletonRows }, (_, index) => (
                  <tr key={`skeleton-${index}`} aria-hidden="true">
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={clsx(column.hideOnMobile && styles.hideMobile)}
                      >
                        <Skeleton width={index % 2 ? '60%' : '80%'} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => {
                  const id = getRowId(row);
                  return (
                    <tr key={id} className={clsx(selectedRowId === id && styles.selected)}>
                      {columns.map((column) => {
                        const Cell = column.rowHeader ? 'th' : 'td';
                        return (
                          <Cell
                            key={column.id}
                            scope={column.rowHeader ? 'row' : undefined}
                            className={clsx(
                              column.align === 'end' && styles.end,
                              column.hideOnMobile && styles.hideMobile,
                            )}
                          >
                            {column.cell(row)}
                          </Cell>
                        );
                      })}
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {status === 'pending' ? <span className="ax-sr-only">{t('states.loading')}</span> : null}
      </div>
      {isEmpty
        ? (empty ?? (
            <EmptyState compact headingLevel={3} icon={<Inbox />} title={t('states.emptyTitle')} />
          ))
        : null}
      {status === 'success' && (rows?.length ?? 0) > 0 && (hasNextPage || onLoadMore) ? (
        <div className={styles.footer}>
          <span className={styles.count} aria-live="polite">
            {t('table.showing', { count: rows?.length ?? 0 })}
          </span>
          {hasNextPage && onLoadMore ? (
            <Button size="sm" onClick={onLoadMore} loading={isFetchingNextPage}>
              {t('table.loadMore')}
            </Button>
          ) : (
            <span className={styles.count}>{t('table.allLoaded')}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
