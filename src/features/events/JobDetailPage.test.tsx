import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { JobDetailPage } from './JobDetailPage';
import { PID, baseJob, mockApi, renderPage } from './test-helpers';

afterEach(() => configureApi({ baseUrl: '' }));

function render() {
  return renderPage(<JobDetailPage />, {
    route: `/p/${PID}/jobs/job_1`,
    path: '/p/:productId/jobs/:jobId',
  });
}

describe('JobDetailPage', { timeout: 20_000 }, () => {
  it('shows attempts, timestamps, the redacted error and the payload', async () => {
    mockApi(({ path }) =>
      path === `/v1/products/${PID}/jobs/job_1`
        ? jsonResponse({ ...baseJob, result: { sent: 3 } })
        : undefined,
    );
    render();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'reports.send' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('5 of 5').length).toBeGreaterThan(0);
    expect(screen.getByText(/upstream said no \(token=\[redacted\]\)/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Payload' })).toHaveTextContent('[redacted]');
    expect(screen.getByRole('region', { name: 'Result' })).toHaveTextContent('"sent": 3');
    expect(screen.getByText('host-1:123')).toBeInTheDocument();
    // Dead jobs can be retried, not cancelled.
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel job' })).not.toBeInTheDocument();
  });

  it('cancels a queued job', async () => {
    let status = 'queued';
    const { calls } = mockApi(({ method, path }) => {
      if (method === 'GET' && path === `/v1/products/${PID}/jobs/job_1`) {
        return jsonResponse({ ...baseJob, status, attempts: 0, last_error: null });
      }
      if (method === 'POST' && path === `/v1/products/${PID}/jobs/job_1/cancel`) {
        status = 'cancelled';
        return jsonResponse({ ...baseJob, status, attempts: 0, last_error: null });
      }
      return undefined;
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Cancel job' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel job' });
    expect(dialog).toHaveTextContent('has not started yet');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel job' }));
    await waitFor(() => expect(calls.some((call) => call.path.endsWith('/cancel'))).toBe(true));
    expect(await screen.findByText('Job cancelled')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cancel job' })).not.toBeInTheDocument(),
    );
  });

  it('explains a job the worker skipped because its tenant was not active', async () => {
    mockApi(({ path }) =>
      path === `/v1/products/${PID}/jobs/job_1`
        ? jsonResponse({
            ...baseJob,
            status: 'failed',
            attempts: 0,
            created_by: 'schedule:sch_1',
            last_error: 'skipped: the product or tenant is not active',
          })
        : undefined,
    );
    render();
    const note = (await screen.findByText('Skipped, not run')).closest('[role="status"]');
    expect(note).toHaveTextContent(/archived or its tenant is suspended/);
    // The server's reason stays visible, and the job can be retried later.
    expect(screen.getByText('skipped: the product or tenant is not active')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows not found for an unknown job', async () => {
    mockApi(() => undefined);
    render();
    expect(await screen.findByRole('heading', { name: /not found/i })).toBeInTheDocument();
  });
});
