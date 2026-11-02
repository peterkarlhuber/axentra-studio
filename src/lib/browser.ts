/**
 * Leaving the single-page app (a top-level navigation to another origin, such as an identity
 * provider). One object so that tests can replace it: jsdom does not navigate.
 */
export const browserNavigation = {
  assign(url: string): void {
    window.location.assign(url);
  },
};

/** Only http(s) URLs and same-site paths may be navigated to (never `javascript:` and the like). */
export function isNavigableUrl(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
