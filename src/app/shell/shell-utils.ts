/** Keep the current section when switching product (`/p/A/tenants/x` -> `/p/B/tenants`). */
export function switchProductPath(pathname: string, productId: string): string {
  const match = /^\/p\/[^/]+\/([^/]+)/.exec(pathname);
  const section = match?.[1] ?? 'dashboard';
  return `/p/${encodeURIComponent(productId)}/${section}`;
}

/** Two-letter avatar initials from a name or email. */
export function initials(name: string | undefined, email: string | undefined): string {
  const source = (name || email || '?').trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const [first = '', second = ''] = parts;
  const letters = parts.length > 1 ? `${first.charAt(0)}${second.charAt(0)}` : source.slice(0, 2);
  return letters.toUpperCase();
}
