import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from './DataTable';

interface Row {
  id: string;
  name: string;
}

const columns: Column<Row>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name, sortKey: 'name', rowHeader: true },
  { id: 'id', header: 'ID', cell: (row) => row.id },
];

const rows: Row[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];

describe('DataTable', () => {
  it('shows a busy region while pending', () => {
    render(
      <DataTable
        caption="Things"
        columns={columns}
        rows={undefined}
        getRowId={(r) => r.id}
        status="pending"
      />,
    );
    expect(screen.getByRole('region', { name: 'Things' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading…', { exact: false })).toBeInTheDocument();
  });

  it('renders rows with row headers', () => {
    render(
      <DataTable
        caption="Things"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        status="success"
      />,
    );
    const table = screen.getByRole('table', { name: 'Things' });
    expect(within(table).getByRole('rowheader', { name: 'Alpha' })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });

  it('shows the empty state', () => {
    render(
      <DataTable
        caption="Things"
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        status="success"
        empty={<p>Nothing here yet</p>}
      />,
    );
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('shows the error state with retry', async () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        caption="Things"
        columns={columns}
        rows={undefined}
        getRowId={(r) => r.id}
        status="error"
        error={new Error('x')}
        onRetry={onRetry}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('cycles sort ascending, descending, off and exposes aria-sort', async () => {
    const onSortChange = vi.fn();
    const { rerender } = render(
      <DataTable
        caption="Things"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        status="success"
        sort={null}
        onSortChange={onSortChange}
      />,
    );
    const header = screen.getByRole('columnheader', { name: /Name/ });
    expect(header).toHaveAttribute('aria-sort', 'none');
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });

    rerender(
      <DataTable
        caption="Things"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        status="success"
        sort={{ key: 'name', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    );
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'desc' });

    rerender(
      <DataTable
        caption="Things"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        status="success"
        sort={{ key: 'name', direction: 'desc' }}
        onSortChange={onSortChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenLastCalledWith(null);
  });

  it('loads more with the cursor button until everything is loaded', async () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <DataTable
        caption="Things"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        status="success"
        hasNextPage
        onLoadMore={onLoadMore}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(
      <DataTable
        caption="Things"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        status="success"
        hasNextPage={false}
        onLoadMore={onLoadMore}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });
});
