import type { AuditEvent } from '@/api/models';

/** `datetime-local` value (local time) -> RFC 3339 UTC for the API. */
export function localToRfc3339(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function eventTime(event: AuditEvent): string {
  return event.occurred_at;
}

export function actorLabel(event: AuditEvent): string {
  return event.actor_display || event.actor_id;
}
