import { useCallback, useEffect, useRef, useState } from 'react';
import {
  openEventStream,
  type StreamCloseReason,
  type StreamMessage,
  type StreamStatus,
} from './event-stream';

export interface EventStreamState {
  /** `idle` while no URL is given (stream switched off). */
  status: StreamStatus | 'idle';
  lastEventId: string | null;
  /** Delay before the next reconnect attempt, while `reconnecting`. */
  retryMs: number | undefined;
  closeReason: StreamCloseReason | null;
  /** Open a new connection after `closed`, resuming from the last seen position. */
  reconnect: () => void;
}

interface Connection {
  key: string;
  status: StreamStatus;
  lastEventId: string | null;
  retryMs: number | undefined;
  closeReason: StreamCloseReason | null;
}

/**
 * Keeps one SSE connection open while `url` is set. Messages go to `onMessage` (the latest
 * callback is always used, so callers need not memoize it). A manual reconnect resumes from
 * the last seen position; a different URL (other filter) starts with new items again.
 */
export function useEventStream(
  url: string | null,
  onMessage: (message: StreamMessage) => void,
): EventStreamState {
  const [attempt, setAttempt] = useState(0);
  const [connection, setConnection] = useState<Connection | null>(null);
  const handler = useRef(onMessage);
  const lastId = useRef<{ url: string | null; id: string | null }>({ url: null, id: null });
  const key = url ? `${attempt}:${url}` : null;

  useEffect(() => {
    handler.current = onMessage;
  });

  useEffect(() => {
    if (!url || !key) return;
    if (lastId.current.url !== url) lastId.current = { url, id: null };
    const update = (patch: Partial<Connection>) =>
      setConnection((current) => ({
        key,
        status: 'connecting',
        lastEventId: lastId.current.id,
        retryMs: undefined,
        closeReason: null,
        ...(current?.key === key ? current : {}),
        ...patch,
      }));
    return openEventStream(
      { url, lastEventId: lastId.current.id },
      {
        onMessage: (message) => {
          if (message.id) {
            lastId.current.id = message.id;
            update({ lastEventId: message.id });
          }
          handler.current(message);
        },
        onStatus: (status, info) => {
          if (info.lastEventId) lastId.current.id = info.lastEventId;
          update({ status, retryMs: info.retryMs, lastEventId: lastId.current.id });
        },
        onClose: (closeReason) => update({ status: 'closed', closeReason }),
      },
    );
  }, [url, key]);

  const reconnect = useCallback(() => setAttempt((value) => value + 1), []);
  if (!key) {
    return { status: 'idle', lastEventId: null, retryMs: undefined, closeReason: null, reconnect };
  }
  const current = connection?.key === key ? connection : null;
  return {
    status: current?.status ?? 'connecting',
    lastEventId: current?.lastEventId ?? null,
    retryMs: current?.retryMs,
    closeReason: current?.closeReason ?? null,
    reconnect,
  };
}
