import { describe, expect, it, vi } from 'vitest';
import { openEventStream, SseParser, type StreamMessage } from './event-stream';

describe('SseParser', () => {
  it('parses ids, named events, multi-line data, comments and retry across chunks', () => {
    const messages: { id: string | null; event: string; data: string }[] = [];
    const retry = vi.fn();
    const parser = new SseParser((message) => messages.push(message), retry);
    parser.push('retry: 3000\n\n: keep-alive\n\nid: 7\nevent: invoice.cre');
    parser.push('ated\ndata: {"a":1}\n\r\nid: 8\ndata: line1\ndata: line2\n');
    parser.push('\n');
    expect(retry).toHaveBeenCalledWith(3000);
    expect(messages).toEqual([
      { id: '7', event: 'invoice.created', data: '{"a":1}' },
      { id: '8', event: 'message', data: 'line1\nline2' },
    ]);
  });
});

function streamResponse() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  const encoder = new TextEncoder();
  return {
    response: new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }),
    send: (text: string) => controller.enqueue(encoder.encode(text)),
    end: () => controller.close(),
  };
}

describe('openEventStream', () => {
  it('sends credentials, resumes with Last-Event-ID after a close and stops on 401', async () => {
    const first = streamResponse();
    const requests: RequestInit[] = [];
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      requests.push(init ?? {});
      if (requests.length === 1) return first.response;
      return new Response(JSON.stringify({ code: 'unauthenticated' }), { status: 401 });
    });
    const messages: StreamMessage[] = [];
    const statuses: string[] = [];
    const onClose = vi.fn();
    const stop = openEventStream(
      { url: 'http://api/v1/products/p/events/stream', fetch: fetchMock as typeof fetch },
      {
        onMessage: (message) => messages.push(message),
        onStatus: (status) => statuses.push(status),
        onClose,
      },
    );
    await vi.waitFor(() => expect(statuses).toContain('open'));
    first.send('retry: 5\n\nid: 41\nevent: invoice.created\ndata: {"id":"evt_1"}\n\n');
    await vi.waitFor(() => expect(messages).toHaveLength(1));
    expect(messages[0]).toEqual({ id: '41', event: 'invoice.created', data: { id: 'evt_1' } });
    first.end();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    stop();

    expect(requests[0]?.credentials).toBe('include');
    expect((requests[0]?.headers as Record<string, string>)['Last-Event-ID']).toBeUndefined();
    expect((requests[1]?.headers as Record<string, string>)['Last-Event-ID']).toBe('41');
    expect(statuses).toEqual(['connecting', 'open', 'reconnecting', 'reconnecting', 'closed']);
    expect(onClose.mock.calls[0]?.[0]).toMatchObject({ kind: 'access' });
  });

  it('closes when the server reports failed re-authentication', async () => {
    const first = streamResponse();
    const onClose = vi.fn();
    const stop = openEventStream(
      { url: 'x', fetch: (async () => first.response) as unknown as typeof fetch },
      { onMessage: vi.fn(), onStatus: vi.fn(), onClose },
    );
    await vi.waitFor(() =>
      first.send('event: error\ndata: {"code":"forbidden","detail":"gone"}\n\n'),
    );
    await vi.waitFor(() =>
      expect(onClose).toHaveBeenCalledWith({ kind: 'access', code: 'forbidden', detail: 'gone' }),
    );
    stop();
  });
});
