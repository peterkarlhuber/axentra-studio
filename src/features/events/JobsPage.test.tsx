import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { JobsPage } from './JobsPage';
import { PID, baseJob, mockApi, page, renderPage } from './test-helpers';

const stats = {
  counts: { queued: 2, running: 1, succeeded: 10, failed: 0, dead: 1, cancelled: 0 },
  failed_last_24h: 1,
  succeeded_last_24h: 10,
  oldest_queued_at: '2026-10-01T09:00:00Z',
  by_kind: [],
};

afterEach(() => configureApi({ baseUrl: '' }));

function render(route = `/p/${PID}/jobs`) {
  return renderPage(<JobsPage />, { route, path: '/p/:productId/jobs' });
}

describe('JobsPage', { timeout: 20_000 }, () => {
  it('lists jobs with counters and filters by status through the URL', async () => {
    const { calls } = mockApi(({ method, path }) => {
      if (method === 'GET' && path === `/v1/products/${PID}/jobs/stats`) return jsonResponse(stats);
      if (method === 'GET' && path === `/v1/products/${PID}/jobs`) return page([baseJob], 'c2');
      return undefined;
    });
    const user = userEvent.setup();
    render();

    expect(await screen.findByRole('link', { name: 'reports.send' })).toHaveAttribute(
      'href',
      `/p/${PID}/jobs/job_1`,
    );
    expect(screen.getAllByText('Dead').length).toBeGreaterThan(0);
    expect(screen.getByText('5 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^1\s*Dead/ }));
    await waitFor(() =>
      expect(
        calls.some((call) => call.path.endsWith('/jobs') && call.search.get('status') === 'dead'),
      ).toBe(true),
    );

    await user.type(screen.getByLabelText('Kind'), 'reports.send');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.path.endsWith('/jobs') &&
            call.search.get('kind') === 'reports.send' &&
            call.search.get('status') === 'dead',
        ),
      ).toBe(true),
    );
  });

  it('retries a dead job after confirmation', async () => {
    const { calls } = mockApi(({ method, path }) => {
      if (path.endsWith('/jobs/stats')) return jsonResponse(stats);
      if (method === 'GET' && path.endsWith('/jobs')) return page([baseJob]);
      if (method === 'POST' && path === `/v1/products/${PID}/jobs/job_1/retry`) {
        return jsonResponse({ ...baseJob, status: 'queued', attempts: 0 });
      }
      return undefined;
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Actions for job job_1' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Retry' }));
    const dialog = await screen.findByRole('dialog', { name: 'Retry job' });
    await user.click(within(dialog).getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(calls.some((call) => call.method === 'POST' && call.path.endsWith('/retry'))).toBe(
        true,
      ),
    );
    expect(await screen.findByText('Job queued again')).toBeInTheDocument();
  });

  it('enqueues a job with an idempotency key and opens it', async () => {
    const { calls } = mockApi(({ method, path }) => {
      if (path.endsWith('/jobs/stats')) return jsonResponse(stats);
      if (method === 'GET' && path.endsWith('/jobs')) return page([]);
      if (method === 'POST' && path === `/v1/products/${PID}/jobs`) {
        return jsonResponse({ ...baseJob, id: 'job_new', status: 'queued' }, { status: 201 });
      }
      return undefined;
    });
    const user = userEvent.setup();
    render();
    expect(await screen.findByText('No jobs yet')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Enqueue job' }));
    const dialog = await screen.findByRole('dialog', { name: 'Enqueue job' });
    const kind = within(dialog).getByLabelText(/^Kind/);
    await user.type(kind, 'axentra.internal');
    expect(within(dialog).getByText(/reserved for Axentra/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Enqueue' })).toBeDisabled();

    await user.clear(kind);
    await user.type(kind, 'reports.send');
    const payload = within(dialog).getByLabelText('Payload');
    await user.clear(payload);
    await user.type(payload, '{{"report": "monthly"}');
    await user.click(within(dialog).getByRole('button', { name: 'Enqueue' }));

    expect(await screen.findByTestId('location')).toHaveTextContent(`/p/${PID}/jobs/job_new`);
    const post = calls.find((call) => call.method === 'POST' && call.path.endsWith('/jobs'));
    expect(post?.body).toMatchObject({ kind: 'reports.send', payload: { report: 'monthly' } });
    expect(post?.headers.get('Idempotency-Key')).toMatch(/.{8,}/);
  });

  it('explains a 409 idempotency conflict and a 403 for kinds not open to the caller', async () => {
    let attempt = 0;
    const { calls } = mockApi(({ method, path }) => {
      if (path.endsWith('/jobs/stats')) return jsonResponse(stats);
      if (method === 'GET' && path.endsWith('/jobs')) return page([]);
      if (method === 'POST' && path === `/v1/products/${PID}/jobs`) {
        attempt += 1;
        if (attempt === 1)
          return jsonResponse(
            {
              code: 'conflict',
              status: 409,
              detail: 'the idempotency key was already used for a different request',
            },
            { status: 409 },
          );
        return jsonResponse(
          {
            code: 'forbidden',
            status: 403,
            detail: 'missing permission jobs:manage (job kind x is not open to tenant callers)',
          },
          { status: 403 },
        );
      }
      return undefined;
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Enqueue job' }));
    const dialog = await screen.findByRole('dialog', { name: 'Enqueue job' });
    await user.type(within(dialog).getByLabelText(/^Kind/), 'reports.send');
    const keyField = within(dialog).getByLabelText(/^Idempotency key/);
    const firstKey = (keyField as HTMLInputElement).value;
    await user.click(within(dialog).getByRole('button', { name: 'Enqueue' }));
    expect(
      await within(dialog).findByText('Already used for a different request'),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Use a new key' }));
    expect((keyField as HTMLInputElement).value).not.toBe(firstKey);
    await user.click(within(dialog).getByRole('button', { name: 'Enqueue' }));
    expect(await within(dialog).findByText(/is not open to tenant callers/)).toBeInTheDocument();
    const posts = calls.filter((call) => call.method === 'POST' && call.path.endsWith('/jobs'));
    expect(posts[1]?.headers.get('Idempotency-Key')).not.toBe(firstKey);
  });

  it('hides management actions without jobs:manage', async () => {
    mockApi(
      ({ method, path }) => {
        if (path.endsWith('/jobs/stats')) return jsonResponse(stats);
        if (method === 'GET' && path.endsWith('/jobs')) return page([baseJob]);
        return undefined;
      },
      { permissions: ['jobs:read'] },
    );
    render();
    expect(await screen.findByRole('link', { name: 'reports.send' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enqueue job' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for job/ })).not.toBeInTheDocument();
  });

  it('explains a missing permission from the server', async () => {
    mockApi(({ path }) =>
      path.includes('/jobs')
        ? jsonResponse({ code: 'forbidden', status: 403 }, { status: 403 })
        : undefined,
    );
    render();
    expect(await screen.findByRole('heading', { name: /not permitted/i })).toBeInTheDocument();
  });
});
