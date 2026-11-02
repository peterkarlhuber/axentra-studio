import type { JobStatus, WebhookDeliveryStatus } from '@/api/models';
import type { Tone } from '@/components/ui';

export const JOB_STATUSES: JobStatus[] = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'dead',
  'cancelled',
];
export const DELIVERY_STATUSES: WebhookDeliveryStatus[] = [
  'pending',
  'succeeded',
  'failed',
  'dead',
];

export const JOB_TONES: Record<JobStatus, Tone> = {
  queued: 'info',
  running: 'brand',
  succeeded: 'success',
  failed: 'danger',
  dead: 'danger',
  cancelled: 'neutral',
};

export const DELIVERY_TONES: Record<WebhookDeliveryStatus, Tone> = {
  pending: 'info',
  succeeded: 'success',
  failed: 'warning',
  dead: 'danger',
};

/** Retry exists for failed and dead jobs only (`409` otherwise). */
export const canRetryJob = (status: JobStatus) => status === 'failed' || status === 'dead';
/** Cancel exists for queued and running jobs only (`409` when finished). */
export const canCancelJob = (status: JobStatus) => status === 'queued' || status === 'running';

/** Job kinds and event types: `^[a-z][a-z0-9_.:-]{0,99}$`; `axentra.` is reserved. */
export const KIND_PATTERN = /^[a-z][a-z0-9_.:-]{0,99}$/;
export function kindProblem(kind: string): 'invalid' | 'reserved' | null {
  const value = kind.trim();
  if (!value) return null;
  if (!KIND_PATTERN.test(value)) return 'invalid';
  if (value.startsWith('axentra.')) return 'reserved';
  return null;
}

/** Parse a JSON object from a textarea; empty text is `{}`. */
export function parseJsonObject(
  text: string,
): { ok: true; value: Record<string, unknown> } | { ok: false } {
  if (!text.trim()) return { ok: true, value: {} };
  try {
    const value = JSON.parse(text) as unknown;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ok: true, value: value as Record<string, unknown> };
    }
  } catch {
    // fall through
  }
  return { ok: false };
}

export const INTERVAL_UNITS = [
  { unit: 'seconds', seconds: 1 },
  { unit: 'minutes', seconds: 60 },
  { unit: 'hours', seconds: 3600 },
  { unit: 'days', seconds: 86_400 },
] as const;
export type IntervalUnit = (typeof INTERVAL_UNITS)[number]['unit'];

export const MIN_INTERVAL_SECONDS = 10;
export const MAX_INTERVAL_SECONDS = 31_622_400;

/** Largest unit that divides the interval evenly (3600 -> 1 hour, 90 -> 90 seconds). */
export function splitInterval(seconds: number): { amount: number; unit: IntervalUnit } {
  for (const entry of [...INTERVAL_UNITS].reverse()) {
    if (seconds % entry.seconds === 0) return { amount: seconds / entry.seconds, unit: entry.unit };
  }
  return { amount: seconds, unit: 'seconds' };
}

export function intervalSeconds(amount: number, unit: IntervalUnit): number {
  const entry = INTERVAL_UNITS.find((item) => item.unit === unit) ?? INTERVAL_UNITS[0];
  return Math.round(amount * entry.seconds);
}

/**
 * Webhook URL check before the server's own (which also resolves the host and refuses
 * private targets): absolute http(s) URL, no credentials, no fragment.
 */
export function webhookUrlProblem(
  url: string,
): 'invalid' | 'scheme' | 'credentials' | 'fragment' | null {
  const value = url.trim();
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return 'invalid';
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return 'scheme';
  if (!parsed.hostname) return 'invalid';
  if (parsed.username || parsed.password) return 'credentials';
  if (value.includes('#')) return 'fragment';
  return null;
}

/** Event type patterns: a type or a glob with `*` (for example `invoice.*` or `*`). */
export const EVENT_PATTERN = /^[a-z0-9_.:*-]{1,150}$/;

export function splitPatterns(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

/** Random idempotency key for one create action (a retry of the same submit reuses it). */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `studio-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export interface WebhookFormValues {
  url: string;
  description: string;
  eventTypes: string[];
  enabled: boolean;
}

export const webhookFormInvalid = (values: WebhookFormValues) =>
  !values.url.trim() || Boolean(webhookUrlProblem(values.url)) || values.eventTypes.length === 0;
