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
