import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { SchedulesPage } from './SchedulesPage';
import { PID, mockApi, page, renderPage } from './test-helpers';

const schedule = {
  id: 'sch_1',
  product_id: PID,
  tenant_id: null,
  name: 'Nightly report',
  kind: 'reports.send',
  payload: { report: 'nightly' },
  interval_seconds: 3600,
  cron: null,
  enabled: true,
  priority: 0,
  max_attempts: 5,
  next_run_at: '2026-11-02T01:00:00Z',
  last_run_at: '2026-11-02T00:00:00Z',
  last_job_id: 'job_9',
  version: 3,
  created_by: 'usr_1',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

afterEach(() => configureApi({ baseUrl: '' }));

function render(route = `/p/${PID}/schedules`) {
  return renderPage(<SchedulesPage />, { route, path: '/p/:productId/schedules' });
}

describe('SchedulesPage', { timeout: 20_000 }, () => {
  it('lists schedules with their timing and links the last job', async () => {
    mockApi(({ path }) => (path.endsWith('/schedules') ? page([schedule]) : undefined));
    render();
    expect(await screen.findByRole('rowheader', { name: /Nightly report/ })).toBeInTheDocument();
    expect(screen.getByText('Every 1 hour')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', `/p/${PID}/jobs/job_9`);
  });

  it('validates the cron expression and creates a cron schedule', async () => {
    const { calls } = mockApi(({ method, path }) => {
      if (method === 'GET' && path.endsWith('/schedules')) return page([]);
      if (method === 'POST' && path === `/v1/products/${PID}/schedules`) {
        return jsonResponse(
          { ...schedule, id: 'sch_2', cron: '0 9 * * 1-5', interval_seconds: null },
          { status: 201 },
        );
      }
      return undefined;
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'New schedule' }));
    const dialog = await screen.findByRole('dialog', { name: 'New schedule' });
    await user.type(within(dialog).getByLabelText(/^Name/), 'Morning digest');
    await user.type(within(dialog).getByLabelText(/^Kind/), 'digest.send');
    await user.click(within(dialog).getByRole('radio', { name: 'Cron expression' }));
    const cron = within(dialog).getByRole('textbox', { name: /^Cron expression/ });
    await user.type(cron, '61 * * * *');
    expect(within(dialog).getByText(/minute field must be between 0 and 59/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Create schedule' })).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: 'Weekdays at 09:00' }));
    expect(cron).toHaveValue('0 9 * * 1-5');
    await user.click(within(dialog).getByRole('button', { name: 'Create schedule' }));
    expect(await screen.findByText('Schedule “Nightly report” created')).toBeInTheDocument();
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.body).toMatchObject({
      name: 'Morning digest',
      kind: 'digest.send',
      cron: '0 9 * * 1-5',
      interval_seconds: null,
      enabled: true,
    });
  });

  it('shows the server explanation when it rejects a cron expression', async () => {
    mockApi(({ method, path }) => {
      if (method === 'GET' && path.endsWith('/schedules')) return page([]);
      if (method === 'POST') {
        return jsonResponse(
          {
            code: 'validation_failed',
            status: 422,
            detail: 'cron expression never matches',
            request_id: 'req_9',
          },
          { status: 422 },
        );
      }
      return undefined;
    });
    const user = userEvent.setup();
    render(`/p/${PID}/schedules?new=1`);
    const dialog = await screen.findByRole('dialog', { name: 'New schedule' });
    await user.type(within(dialog).getByLabelText(/^Name/), 'Never');
    await user.type(within(dialog).getByLabelText(/^Kind/), 'x.y');
    await user.click(within(dialog).getByRole('radio', { name: 'Cron expression' }));
    await user.type(
      within(dialog).getByRole('textbox', { name: /^Cron expression/ }),
      '0 0 31 2 *',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Create schedule' }));
    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('cron expression never matches');
    expect(alert).toHaveTextContent('req_9');
  });

  it('edits only changed fields with If-Match, toggles and deletes', async () => {
    const { calls } = mockApi(({ method, path }) => {
      if (method === 'GET' && path.endsWith('/schedules')) return page([schedule]);
      if (method === 'PATCH') return jsonResponse({ ...schedule, version: 4 });
      if (method === 'DELETE') return new Response(null, { status: 204 });
      return undefined;
    });
    const user = userEvent.setup();
    render();
    const menu = () => screen.findByRole('button', { name: 'Actions for schedule Nightly report' });

    await user.click(await menu());
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit “Nightly report”' });
    const amount = within(dialog).getByLabelText(/^Every/);
    await user.clear(amount);
    await user.type(amount, '2');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'PATCH')).toBe(true));
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.body).toEqual({ interval_seconds: 7200, cron: null });
    expect(patch?.headers.get('If-Match')).toBe('3');

    await user.click(await menu());
    await user.click(await screen.findByRole('menuitem', { name: 'Disable' }));
    await waitFor(() =>
      expect(calls.filter((call) => call.method === 'PATCH')[1]?.body).toEqual({ enabled: false }),
    );

    await user.click(await menu());
    await user.click(await screen.findByRole('menuitem', { name: 'Delete schedule' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete schedule' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete schedule' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'DELETE')).toBe(true));
    expect(calls.find((call) => call.method === 'DELETE')?.headers.get('If-Match')).toBe('3');
  });
});
