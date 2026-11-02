/**
 * Expiry of a new API key (`expires_at` of `POST /v1/products/{id}/api-keys`): never, a preset
 * number of days from now, or the end of a chosen day (local time). The server refuses a time in
 * the past (`422`); keys created by keys also never outlive the creating key, which does not
 * apply to Studio (keys are created with a user session).
 */
export const EXPIRY_PRESET_DAYS = [30, 90, 365] as const;

export type ExpiryChoice = 'never' | `${(typeof EXPIRY_PRESET_DAYS)[number]}` | 'custom';

export type ExpiryResult =
  { ok: true; expiresAt: string | null } | { ok: false; reason: 'missing' | 'past' };

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` of a local date (the format of `<input type="date">`). */
export function localDateValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The earliest day a custom expiry may name: tomorrow (local). */
export function minCustomDate(now: Date = new Date()): string {
  return localDateValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
}

/** The `expires_at` to send for a choice, or why it is not valid yet. */
export function expiryFor(
  choice: ExpiryChoice,
  customDate: string,
  now = new Date(),
): ExpiryResult {
  if (choice === 'never') return { ok: true, expiresAt: null };
  if (choice !== 'custom') {
    return { ok: true, expiresAt: new Date(now.getTime() + Number(choice) * DAY_MS).toISOString() };
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(customDate);
  if (!match) return { ok: false, reason: 'missing' };
  if (customDate < minCustomDate(now)) return { ok: false, reason: 'past' };
  // The key works until the end of the chosen day, in the browser's time zone.
  const end = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59);
  return { ok: true, expiresAt: end.toISOString() };
}
