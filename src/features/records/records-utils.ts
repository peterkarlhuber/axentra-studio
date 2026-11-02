export function previewData(data: Record<string, unknown> | undefined, max = 90): string {
  const text = JSON.stringify(data ?? {});
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** `true`, `42`, `null`, `{"a":1}` are matched as JSON; anything else as a string. */
export function parseFilterValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return raw;
  }
}

const COLLECTION = /^[a-z][a-z0-9_]{0,62}$/;

/** Collection names as the API accepts them (`^[a-z][a-z0-9_]{0,62}$`). */
export function validCollectionName(name: string): boolean {
  return COLLECTION.test(name);
}

/** Record data must be a JSON object (the API stores at most 256 KiB). */
export function parseRecordData(
  raw: string,
): { ok: true; value: Record<string, unknown> } | { ok: false; reason: 'json' | 'object' } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'json' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'object' };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}
