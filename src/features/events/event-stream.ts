import { CLIENT_HEADER } from '@/api/client';
import { problemToError, type ApiError } from '@/api/errors';

/**
 * Server-sent events client for the Axentra stream endpoints
 * (`GET /v1/products/{pid}/events/stream`, `/jobs/stream`).
 *
 * It follows the EventSource processing model (credentials included, `retry:` honoured,
 * automatic reconnect that sends the last seen `id` as `Last-Event-ID`), but reads the stream
 * with `fetch`. Native `EventSource` only delivers named events to listeners registered for
 * that exact name, and Axentra names every message after its event type (`invoice.created`),
 * which is not known in advance. `fetch` also lets Studio tell "access lost" (401/403) apart
 * from a network problem, so the connection indicator stays honest.
 */

export interface StreamMessage {
  /** Stream position (`id:` field); `null` for messages without one. */
  id: string | null;
  /** `event:` field, for example `invoice.created` or `job.succeeded`. */
  event: string;
  /** Parsed JSON of the `data:` field, or the raw text if it is not JSON. */
  data: unknown;
}

export type StreamStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface StreamCloseReason {
  /** `access`: 401/403 or the server's `event: error` after re-authentication failed. */
  kind: 'access' | 'error';
  error?: ApiError;
  /** Code and detail from an `event: error` message. */
  code?: string;
  detail?: string;
}

export interface StreamHandlers {
  onMessage: (message: StreamMessage) => void;
  onStatus: (status: StreamStatus, info: { lastEventId: string | null; retryMs?: number }) => void;
  onClose?: (reason: StreamCloseReason) => void;
}

export interface StreamOptions {
  url: string;
  /** Resume after this position (sent as `Last-Event-ID` on the first request too). */
  lastEventId?: string | null;
  /** Initial reconnect delay; the server's `retry:` field overrides it. */
  retryMs?: number;
  /** Upper bound for the exponential backoff after failed connection attempts. */
  maxRetryMs?: number;
  fetch?: typeof fetch;
}

/** Incremental `text/event-stream` parser (WHATWG HTML "event stream interpretation"). */
export class SseParser {
  private buffer = '';
  private data: string[] = [];
  private event = '';
  private id: string | undefined = undefined;

  constructor(
    private readonly dispatch: (message: {
      id: string | null;
      event: string;
      data: string;
    }) => void,
    private readonly onRetry: (ms: number) => void = () => undefined,
    private readonly onId: (id: string) => void = () => undefined,
  ) {}

  push(chunk: string) {
    this.buffer += chunk;
    let index: number;
    while ((index = this.buffer.search(/\r\n|\r|\n/)) >= 0) {
      const line = this.buffer.slice(0, index);
      const newline = this.buffer.startsWith('\r\n', index) ? 2 : 1;
      // A lone "\r" at the end of a chunk may be the first half of "\r\n".
      if (newline === 1 && this.buffer[index] === '\r' && index === this.buffer.length - 1) break;
      this.buffer = this.buffer.slice(index + newline);
      this.line(line);
    }
  }

  private line(line: string) {
    if (line === '') {
      this.flush();
      return;
    }
    if (line.startsWith(':')) return; // comment (keep-alive)
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    switch (field) {
      case 'data':
        this.data.push(value);
        break;
      case 'event':
        this.event = value;
        break;
      case 'id':
        if (!value.includes('\0')) this.id = value;
        break;
      case 'retry':
        if (/^\d+$/.test(value)) this.onRetry(Number(value));
        break;
      default:
        break;
    }
  }

  private flush() {
    const id = this.id;
    if (id !== undefined) this.onId(id);
    if (this.data.length > 0) {
      this.dispatch({ id: id ?? null, event: this.event || 'message', data: this.data.join('\n') });
    }
    this.data = [];
    this.event = '';
    this.id = undefined;
  }
}

function parseData(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

/**
 * Open a stream and keep it open until the returned function is called or access is lost.
 * Reconnects after network errors, 5xx answers and normal server-side closes (the API closes
 * every stream after `events.sse_max_seconds`), resuming from the last seen position.
 */
export function openEventStream(options: StreamOptions, handlers: StreamHandlers): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const doFetch = options.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const maxRetry = options.maxRetryMs ?? 30_000;
  let retryMs = options.retryMs ?? 3_000;
  let lastEventId: string | null = options.lastEventId ?? null;
  let failures = 0;

  const run = async () => {
    let first = true;
    while (!signal.aborted) {
      handlers.onStatus(first ? 'connecting' : 'reconnecting', { lastEventId });
      first = false;
      let response: Response;
      try {
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
          'Axentra-Client': CLIENT_HEADER,
        };
        if (lastEventId) headers['Last-Event-ID'] = lastEventId;
        response = await doFetch(options.url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers,
          signal,
        });
      } catch {
        if (signal.aborted) return;
        failures += 1;
        const delay = Math.min(maxRetry, retryMs * 2 ** Math.min(failures - 1, 4));
        handlers.onStatus('reconnecting', { lastEventId, retryMs: delay });
        await sleep(delay, signal);
        continue;
      }

      if (!response.ok || !response.body) {
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          body = undefined;
        }
        const error = problemToError(body, response);
        if ([400, 401, 403, 404, 422].includes(response.status)) {
          handlers.onStatus('closed', { lastEventId });
          handlers.onClose?.({
            kind: response.status === 401 || response.status === 403 ? 'access' : 'error',
            error,
          });
          return;
        }
        failures += 1;
        const delay = Math.min(maxRetry, retryMs * 2 ** Math.min(failures - 1, 4));
        handlers.onStatus('reconnecting', { lastEventId, retryMs: delay });
        await sleep(delay, signal);
        continue;
      }

      failures = 0;
      handlers.onStatus('open', { lastEventId });
      let fatal: StreamCloseReason | null = null;
      const parser = new SseParser(
        (raw) => {
          if (raw.event === 'error' && raw.id === null) {
            // Sent by the API when the periodic re-authentication fails; the stream then ends.
            const payload = parseData(raw.data) as { code?: string; detail?: string } | string;
            fatal = {
              kind: 'access',
              code: typeof payload === 'object' ? payload.code : undefined,
              detail: typeof payload === 'object' ? payload.detail : String(payload),
            };
            return;
          }
          handlers.onMessage({ id: raw.id, event: raw.event, data: parseData(raw.data) });
        },
        (ms) => {
          retryMs = ms;
        },
        (id) => {
          lastEventId = id || null;
        },
      );
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          parser.push(decoder.decode(value, { stream: true }));
          if (fatal) break;
        }
      } catch {
        if (signal.aborted) return;
      }
      if (signal.aborted) return;
      if (fatal) {
        void reader.cancel().catch(() => undefined);
        handlers.onStatus('closed', { lastEventId });
        handlers.onClose?.(fatal);
        return;
      }
      // Normal end of stream (max duration) or a dropped connection: resume after `retry`.
      handlers.onStatus('reconnecting', { lastEventId, retryMs });
      await sleep(retryMs, signal);
    }
  };

  void run();
  return () => controller.abort();
}
