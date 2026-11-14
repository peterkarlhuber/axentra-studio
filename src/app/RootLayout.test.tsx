import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';
import { Link, RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createTestQueryClient } from '@/test/utils';
import { CrumbContext, useCrumbLabel } from './crumbs';
import { RootLayout } from './RootLayout';

function DetailPage() {
  useCrumbLabel('Endpoint (Test)');
  return (
    <>
      <h1>detail page</h1>
      <Link to="/schedules">schedules</Link>
    </>
  );
}

describe('RootLayout', () => {
  // Checked first and without waiting: before the fix, a new setLabel per label change made useCrumbLabel loop
  // forever, which also hung the navigation test below.
  it('keeps the breadcrumb setter stable when labels change', async () => {
    const seen = new Set<unknown>();
    function Probe() {
      const store = useContext(CrumbContext);
      seen.add(store?.setLabel);
      return <button onClick={() => store?.setLabel('/x', `label ${seen.size}`)}>set</button>;
    }
    const router = createMemoryRouter([
      { element: <RootLayout />, children: [{ path: '/', element: <Probe /> }] },
    ]);
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'set' }));
    await userEvent.click(screen.getByRole('button', { name: 'set' }));
    expect(seen.size).toBe(1);
  });

  it('leaves a page that sets a breadcrumb label when a link is clicked', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <RootLayout />,
          children: [
            { path: '/webhooks/1', element: <DetailPage /> },
            { path: '/schedules', element: <h1>schedules page</h1> },
          ],
        },
      ],
      { initialEntries: ['/webhooks/1'] },
    );
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    await userEvent.click(await screen.findByRole('link', { name: 'schedules' }));
    expect(await screen.findByRole('heading', { name: 'schedules page' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/schedules');
  });
});
