/**
 * Helpers for the Search page (backend module `search`, Axentra `docs/modules/SEARCH.md`).
 */

/** One piece of a highlight: plain text, or a match the server wrapped in `<mark>`. */
export interface HighlightPart {
  text: string;
  match: boolean;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** Decodes the entities `html.escape` and `ts_headline` produce (named and numeric). */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[entity.toLowerCase()] ?? whole;
  });
}

/**
 * Splits a server highlight (`title_highlight`, `body_highlight`) into text and matches.
 *
 * The server HTML-escapes the indexed text and wraps only the matches in `<mark>…</mark>`.
 * Studio never renders it as HTML: it splits on exactly these two tags and decodes the
 * entities, so anything else that looks like markup stays visible text.
 */
export function parseHighlight(value: string | null | undefined): HighlightPart[] {
  if (!value) return [];
  const parts: HighlightPart[] = [];
  let match = false;
  for (const piece of value.split(/(<mark>|<\/mark>)/)) {
    if (piece === '<mark>') {
      match = true;
      continue;
    }
    if (piece === '</mark>') {
      match = false;
      continue;
    }
    if (!piece) continue;
    parts.push({ text: decodeEntities(piece), match });
  }
  return parts;
}

/** Document kinds as the server accepts them (`^[a-z][a-z0-9_.-]{0,62}$`). */
export const KIND_PATTERN = /^[a-z][a-z0-9_.-]{0,62}$/;
/** The server accepts at most 20 `kind` parameters. */
export const MAX_KINDS = 20;
/** `q` is 1..500 characters. */
export const MAX_QUERY_LENGTH = 500;

/** Splits the kind filter field (commas or spaces) into distinct kinds. */
export function parseKinds(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\s,]+/)
        .map((kind) => kind.trim())
        .filter(Boolean),
    ),
  ];
}

/** Why a kind filter is refused before sending, or null when it is fine. */
export function kindsProblem(kinds: string[]):
  | { reason: 'invalid'; kind: string }
  | {
      reason: 'tooMany';
    }
  | null {
  const invalid = kinds.find((kind) => !KIND_PATTERN.test(kind));
  if (invalid) return { reason: 'invalid', kind: invalid };
  if (kinds.length > MAX_KINDS) return { reason: 'tooMany' };
  return null;
}
