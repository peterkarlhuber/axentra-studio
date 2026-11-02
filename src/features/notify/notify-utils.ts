import type { NotifyMessageStatus, NotifyTemplateVariant } from '@/api/models';
import type { Tone } from '@/components/ui';

export const MESSAGE_STATUSES: readonly NotifyMessageStatus[] = [
  'queued',
  'sending',
  'sent',
  'failed',
  'suppressed',
];

const STATUS_TONES: Record<NotifyMessageStatus, Tone> = {
  queued: 'info',
  sending: 'info',
  sent: 'success',
  failed: 'danger',
  suppressed: 'neutral',
};

export function messageTone(status: string): Tone {
  return STATUS_TONES[status as NotifyMessageStatus] ?? 'neutral';
}

/** Template keys as the API accepts them (`^[a-z][a-z0-9_.-]{1,62}$`). */
export const TEMPLATE_KEY_PATTERN = /^[a-z][a-z0-9_.-]{1,62}$/;
/** Variable names: the renderer only knows `{{ name }}` with identifier-like names. */
export const VARIABLE_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** Locale tags such as `de`, `en`, `de-at`. */
export const LOCALE_PATTERN = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/;

/** Placeholders (`{{ name }}`) used in the variants, in order of first appearance. */
export function placeholdersIn(variants: Record<string, NotifyTemplateVariant>): string[] {
  const found = new Set<string>();
  const pattern = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
  for (const variant of Object.values(variants)) {
    for (const part of [variant.subject, variant.text, variant.html ?? '']) {
      for (const match of part.matchAll(pattern)) found.add(match[1] as string);
    }
  }
  return [...found];
}

/** Locales sorted with `en` (required by the API) first. */
export function sortLocales(locales: string[]): string[] {
  return [...locales].sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));
}

/**
 * Editor values are strings. Keep the original number/boolean when the text still represents
 * it, so editing a template does not silently change the type of untouched sample values.
 */
export function sampleValue(text: string, original: unknown): unknown {
  if (
    (typeof original === 'number' || typeof original === 'boolean') &&
    String(original) === text
  ) {
    return original;
  }
  return text;
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : String(value);
}

/** A fresh `Idempotency-Key` for one send attempt (retries of the same click reuse it). */
export function newIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) return `studio-${cryptoApi.randomUUID()}`;
  return `studio-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Document for the sandboxed preview frame. The frame has no `allow-scripts` and no
 * `allow-same-origin`; the CSP below additionally blocks every network load (remote images,
 * fonts, styles), so a preview can neither run code nor call home.
 */
export function previewDocument(html: string): string {
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:">`,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<style>html{color-scheme:light}body{margin:16px;font-family:system-ui,sans-serif;color:#111;background:#fff;overflow-wrap:anywhere}</style>',
    '</head><body>',
    html,
    '</body></html>',
  ].join('');
}
