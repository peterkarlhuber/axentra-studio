import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse, renderWithProviders } from '@/test/utils';
import { MonitoringPage } from './MonitoringPage';

const METRICS = `# HELP axentra_http_requests_total HTTP requests by method, route template and status
# TYPE axentra_http_requests_total counter
axentra_http_requests_total{method="GET",route="/v1/meta",status="200"} 1200
axentra_http_requests_total{method="POST",route="/v1/x",status="500"} 3
# HELP axentra_notify_deliveries_total Delivery attempts
# TYPE axentra_notify_deliveries_total counter
axentra_notify_deliveries_total{provider="local",outcome="sent"} 9
axentra_notify_deliveries_total{provider="local",outcome="failed"} 1
`;

const SETTINGS = {
  environment: 'development',
  observability: {
    log_level: 'INFO',
    otel_enabled: false,
    audit_retention_days: 365,
    job_retention_days: 30,
  },
  notify: { provider: 'local', sender: 'x' },
};

type Answer = Response | (() => Response);

function setup(answers: Record<string, Answer>) {
  const calls: Request[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request) => {
      calls.push(request);
      const answer = answers[new URL(request.url).pathname];
      if (!answer) return jsonResponse({ code: 'not_found', status: 404 }, { status: 404 });
      return typeof answer === 'function' ? answer() : answer.clone();
    },
  });
  renderWithProviders(<MonitoringPage />, { route: '/monitoring' });
  return calls;
}

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });

afterEach(() => configureApi({ baseUrl: '' }));

describe('MonitoringPage', () => {
  it('shows each readiness check from a 503 body, metrics values and retention', async () => {
    setup({
      '/v1/health/ready': jsonResponse(
        { status: 'unavailable', checks: { database: true, notify_provider: false } },
        { status: 503 },
      ),
      '/v1/health/live': jsonResponse({ status: 'ok', checks: {} }),
      '/metrics': text(METRICS),
      '/v1/settings': jsonResponse(SETTINGS),
    });
    const readiness = await screen.findByRole('region', { name: 'Readiness' });
    expect(await within(readiness).findByText('notify_provider')).toBeInTheDocument();
    expect(within(readiness).getByText('Unavailable')).toBeInTheDocument();
    expect(within(readiness).getByText('Failing')).toBeInTheDocument();

    const kpis = await screen.findByRole('list', { name: 'Key figures' });
    expect(within(kpis).getByText('1,203')).toBeInTheDocument();
    expect(within(kpis).getByText('9')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /HTTP requests by method/ })).toBeInTheDocument();

    expect(await screen.findByText('365 days')).toBeInTheDocument();
    expect(screen.getAllByText('not reported by the server').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('explains disabled metrics (404)', async () => {
    setup({
      '/v1/health/ready': jsonResponse({ status: 'ok', checks: { database: true } }),
      '/v1/health/live': jsonResponse({ status: 'ok', checks: {} }),
      '/metrics': jsonResponse({ code: 'not_found', status: 404 }, { status: 404 }),
      '/v1/settings': jsonResponse(SETTINGS),
    });
    expect(await screen.findByText('Metrics are not available')).toBeInTheDocument();
  });

  it('asks for a metrics token on 401 and sends it as a bearer token', async () => {
    let attempts = 0;
    const calls = setup({
      '/v1/health/ready': jsonResponse({ status: 'ok', checks: { database: true } }),
      '/v1/health/live': jsonResponse({ status: 'ok', checks: {} }),
      '/metrics': () => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ code: 'unauthenticated', status: 401 }, { status: 401 })
          : text(METRICS);
      },
      '/v1/settings': jsonResponse({ code: 'forbidden', status: 403 }, { status: 403 }),
    });
    expect(await screen.findByText('A metrics token is required')).toBeInTheDocument();
    expect(await screen.findByText(/shown to platform administrators/)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Bearer token'), 's3cret');
    await user.click(screen.getByRole('button', { name: 'Load metrics' }));
    expect(await screen.findByRole('list', { name: 'Key figures' })).toBeInTheDocument();
    await waitFor(() => {
      const withToken = calls.filter((call) => new URL(call.url).pathname === '/metrics').at(-1);
      expect(withToken?.headers.get('Authorization')).toBe('Bearer s3cret');
    });
    expect(window.localStorage.length).toBe(0);
  });
});
