import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { EventsPage } from './EventsPage';
import { PID, mockApi, page, renderPage } from './test-helpers';

const event = {
  id: 'evt_1',
  product_id: PID,
  tenant_id: 'ten_1',
  type: 'invoice.created',
  data: { invoice_id: 'inv_1', total: 42 },
  idempotency_key: null,
  actor_kind: 'user',
  actor_id: 'usr_1',
  request_id: 'req_1',
  occurred_at: '2026-11-01T10:00:00Z',
};

afterEach(() => {
  configureApi({ baseUrl: '' });
  vi.unstubAllGlobals();
});

function render(route = `/p/${PID}/events`) {
  return renderPage(<EventsPage />, { route, path: '/p/:productId/events' });
}

/** A controllable `text/event-stream` response. */
function sseStream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  const encoder = new TextEncoder();
  return {
    response: new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }),
    send: (id: number, type: string, data: object) =>
      controller.enqueue(
        encoder.encode(`id: ${id}\nevent: ${type}\ndata: ${JSON.stringify(data)}\n\n`),
      ),
    raw: (text: string) => controller.enqueue(encoder.encode(text)),
    end: () => controller.close(),
  };
}

describe('EventsPage', { timeout: 20_000 }, () => {
  it('lists the event log, filters by type and shows event details', async () => {
    const { calls } = mockApi(({ path }) => {
      if (path === `/v1/products/${PID}/events`) return page([event]);
      if (path === `/v1/products/${PID}/events/evt_1`) return jsonResponse(event);
      return undefined;
    });
    const user = userEvent.setup();
    render();
    expect(await screen.findByRole('rowheader', { name: 'invoice.created' })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Type/), 'invoice.*');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(calls.some((call) => call.search.get('type') === 'invoice.*')).toBe(true),
    );

    await user.click(screen.getByRole('button', { name: 'Show details of invoice.created' }));
    const drawer = await screen.findByRole('dialog', { name: 'invoice.created' });
    expect(within(drawer).getByRole('region', { name: 'Data' })).toHaveTextContent('inv_1');
    expect(within(drawer).getByText('req_1')).toBeInTheDocument();
  });

  it('rejects an invalid type filter before calling the API', async () => {
    mockApi(({ path }) => (path.endsWith('/events') ? page([]) : undefined));
    const user = userEvent.setup();
    render();
    await user.type(await screen.findByLabelText(/^Type/), 'Invoice Created');
    expect(screen.getByLabelText(/^Type/)).toHaveAccessibleDescription(/Enter an exact type/);
  });

  it('streams live events with pause, resume and an honest connection state', async () => {
    mockApi(() => undefined);
    const first = sseStream();
    const streamRequests: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        streamRequests.push({ url, init });
        if (streamRequests.length === 1) return first.response;
        return new Response(JSON.stringify({ code: 'forbidden', status: 403 }), { status: 403 });
      }),
    );
    const user = userEvent.setup();
    render(`/p/${PID}/events?view=live`);

    expect(await screen.findByText('Live')).toBeInTheDocument();
    expect(streamRequests[0]?.url).toBe(`http://axentra.test/v1/products/${PID}/events/stream`);
    expect(streamRequests[0]?.init.credentials).toBe('include');
    first.raw('retry: 5\n\n');
    first.send(10, 'invoice.created', event);
    expect(await screen.findByText('invoice.created')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('Live, paused')).toBeInTheDocument();
    first.send(11, 'invoice.paid', { ...event, id: 'evt_2', type: 'invoice.paid' });
    const resume = await screen.findByRole('button', { name: 'Resume (1 new event)' });
    expect(screen.queryByText('invoice.paid')).not.toBeInTheDocument();
    await user.click(resume);
    expect(await screen.findByText('invoice.paid')).toBeInTheDocument();

    // The server closes the stream; the client resumes after the last position and reports
    // the refusal instead of pretending to be live.
    first.end();
    expect(await screen.findByText(/Disconnected/)).toBeInTheDocument();
    expect((streamRequests[1]?.init.headers as Record<string, string>)['Last-Event-ID']).toBe('11');
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
  });

  it('publishes an event in a tenant', async () => {
    const { calls } = mockApi(({ method, path }) => {
      if (method === 'GET' && path.endsWith('/events')) return page([]);
      if (method === 'POST' && path === `/v1/products/${PID}/tenants/ten_1/events`) {
        return jsonResponse(event, { status: 201 });
      }
      return undefined;
    });
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole('button', { name: 'Publish event' }));
    const dialog = await screen.findByRole('dialog', { name: 'Publish event' });
    await user.selectOptions(await within(dialog).findByLabelText('Tenant'), 'ten_1');
    await user.type(within(dialog).getByLabelText(/^Type/), 'invoice.created');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    expect(await screen.findByText('Event “invoice.created” published')).toBeInTheDocument();
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.body).toEqual({ type: 'invoice.created', data: {} });
    expect(post?.headers.get('Idempotency-Key')).toBeTruthy();
  });
});
