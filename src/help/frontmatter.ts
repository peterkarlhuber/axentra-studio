/** Front matter of a help article: a `---` block of `key: value` lines (no nested YAML). */
export interface FrontMatter {
  title: string;
  summary: string;
  keywords: string[];
  related: string[];
}

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontMatter(source: string): { meta: FrontMatter; body: string } {
  const match = FENCE.exec(source);
  const fields: Record<string, string> = {};
  if (match) {
    for (const line of (match[1] ?? '').split(/\r?\n/)) {
      const index = line.indexOf(':');
      if (index <= 0) continue;
      let value = line.slice(index + 1).trim();
      // Prettier quotes values that contain a colon: "Plans: end to end".
      if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
      fields[line.slice(0, index).trim()] = value;
    }
  }
  const list = (value: string | undefined) =>
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  return {
    meta: {
      title: fields.title ?? '',
      summary: fields.summary ?? '',
      keywords: list(fields.keywords),
      related: list(fields.related),
    },
    body: match ? source.slice(match[0].length) : source,
  };
}

/** `Create a tenant {#create}` -> `{ text: 'Create a tenant', id: 'create' }`. */
export function splitHeadingAnchor(raw: string): { text: string; id: string | null } {
  const match = /\s*\{#([a-z0-9][a-z0-9-]*)\}\s*$/.exec(raw);
  if (!match) return { text: raw.trim(), id: null };
  return { text: raw.slice(0, match.index).trim(), id: match[1] ?? null };
}
