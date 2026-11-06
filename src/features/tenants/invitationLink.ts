/**
 * Invitation links. Axentra's default link is `<public_url>/accept-invitation?token=...`;
 * Studio's accept page is `/invitations/accept`. The public alias forwards the first to the
 * second (see `AcceptInvitationAlias`), so links already sent keep working.
 *
 * The token is a credential. It is read from the address bar once, at startup
 * (`captureInvitationFromAddressBar`) or by the accept page, and removed from it at once
 * (history replace), so it neither stays in the history nor reaches the sign-in page URL, a
 * `Referer` or a proxy log. It is kept for the rest of the tab's session only (sessionStorage,
 * else memory), so it survives a sign-in, a single sign-on round trip or an expired session; it
 * never goes into `return_to` and is sent to the server only in request bodies.
 *
 * Paths are compared after normalization (percent-decoding, case, repeated and trailing
 * slashes), the way the router matches them: `/INVITATIONS/accept/?token=` is the accept page.
 */
export const ACCEPT_INVITATION_PATH = '/invitations/accept';
/** Path of the link Axentra generates by default (`notify.invitation_accept_url` unset). */
export const LEGACY_ACCEPT_INVITATION_PATH = '/accept-invitation';

const STORAGE_KEY = 'axentra.studio.pendingInvitation';
/** Fallback when sessionStorage is unavailable: the token lives until the page unloads. */
let memoryToken: string | null = null;
const SSO_KEY = 'axentra.studio.invitationSentWithSso';
/**
 * Query parameter Axentra adds to `return_to` after a single sign-on that accepted the
 * invitation given on start (`invitation_accepted=<tenant id>`).
 */
export const INVITATION_ACCEPTED_PARAM = 'invitation_accepted';
/** The same for a product team invitation (`product_invitation_accepted=<product id>`). */
export const PRODUCT_INVITATION_ACCEPTED_PARAM = 'product_invitation_accepted';

/** Product team invitations (operators) have their own token prefix and accept endpoint. */
export function isProductInvitationToken(token: string): boolean {
  return token.startsWith('axpinv_');
}

/** The token kept for this tab, or null. */
export function readPendingInvitation(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryToken;
  }
}

export function writePendingInvitation(token: string | null): void {
  try {
    if (token) window.sessionStorage.setItem(STORAGE_KEY, token);
    else window.sessionStorage.removeItem(STORAGE_KEY);
    memoryToken = null;
  } catch {
    // Storage unavailable: the token lives only in memory until the page unloads.
    memoryToken = token || null;
  }
}

/**
 * Marks that this tab started a single sign-on with the pending invitation (the server then
 * accepts it right after the sign-in). Only then does the accept page trust
 * `invitation_accepted`, so a crafted link cannot discard a pending invitation.
 */
export function markInvitationSentWithSso(): void {
  try {
    window.sessionStorage.setItem(SSO_KEY, '1');
  } catch {
    // Storage unavailable: the accept page falls back to asking for a confirmation.
  }
}

export function invitationSentWithSso(): boolean {
  try {
    return window.sessionStorage.getItem(SSO_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearInvitationSentWithSso(): void {
  try {
    window.sessionStorage.removeItem(SSO_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Percent-decodes until nothing changes (`%2561` -> `%61` -> `a`); malformed input stays. */
function fullyDecode(value: string): string {
  let current = value;
  for (let round = 0; round < 8; round += 1) {
    let next: string;
    try {
      next = decodeURIComponent(current);
    } catch {
      return current;
    }
    if (next === current) break;
    current = next;
  }
  return current;
}

/**
 * A pathname as the router matches it: percent-decoded, lowercase, repeated slashes collapsed,
 * no trailing slash (`/INVITATIONS//accept/` and `/invitations/%61ccept` are `/invitations/accept`).
 */
export function normalizePathname(pathname: string): string {
  const path = fullyDecode(pathname).toLowerCase().replace(/\/+/g, '/').replace(/\/+$/, '');
  return path || '/';
}

/** Whether the path (without query) is the accept page or the public `/accept-invitation` alias. */
export function isInvitationPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === ACCEPT_INVITATION_PATH || path === LEGACY_ACCEPT_INVITATION_PATH;
}

/** Query names that carry an invitation token (compared decoded and case-insensitively). */
function isTokenName(name: string): boolean {
  const key = fullyDecode(name).trim().toLowerCase();
  return key === 'token' || key === 'invitation';
}

function splitPath(path: string): { pathname: string; query: string; hash: string } {
  const hashAt = path.indexOf('#');
  const beforeHash = hashAt === -1 ? path : path.slice(0, hashAt);
  const queryAt = beforeHash.indexOf('?');
  return {
    pathname: queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt),
    query: queryAt === -1 ? '' : beforeHash.slice(queryAt + 1),
    hash: hashAt === -1 ? '' : path.slice(hashAt),
  };
}

/** The invitation token in a Studio path that leads to the accept page (any spelling), if any. */
export function invitationTokenFromPath(path: string): string | null {
  const { pathname, query } = splitPath(path);
  if (!isInvitationPath(pathname)) return null;
  for (const [name, value] of new URLSearchParams(query)) {
    if (isTokenName(name) && value.trim()) return value.trim();
  }
  return null;
}

/**
 * A Studio path without the invitation token. An accept-page path (any spelling) becomes the
 * canonical `/invitations/accept` with its other query parameters and hash. Used wherever the
 * path leaves the page state: the address bar, `return_to` of a sign-in and of a single sign-on
 * start (which the server stores and proxies may log).
 */
export function withoutInvitationToken(path: string): string {
  const { pathname, query, hash } = splitPath(path);
  if (!isInvitationPath(pathname)) return path;
  const rest = new URLSearchParams(query);
  for (const name of [...rest.keys()]) if (isTokenName(name)) rest.delete(name);
  const search = rest.toString();
  return `${ACCEPT_INVITATION_PATH}${search ? `?${search}` : ''}${hash}`;
}

/**
 * `return_to` of a single sign-on start: also without any other token-like query parameter on
 * other pages (`token`, `*_token`, `invitation`), which the server would drop anyway.
 */
export function ssoReturnPath(path: string): string {
  const cleaned = withoutInvitationToken(path);
  const { pathname, query, hash } = splitPath(cleaned);
  if (!query) return cleaned;
  const rest = new URLSearchParams(query);
  const secret = (name: string) => {
    const key = fullyDecode(name).trim().toLowerCase();
    return key === 'token' || key.endsWith('_token') || key === 'invitation';
  };
  if (![...rest.keys()].some(secret)) return cleaned;
  for (const name of [...rest.keys()]) if (secret(name)) rest.delete(name);
  const search = rest.toString();
  return `${pathname}${search ? `?${search}` : ''}${hash}`;
}

/**
 * Moves an invitation token out of a Studio path into the tab's pending invitation and returns
 * the path without it (unchanged when it holds none).
 */
export function takeInvitationToken(path: string): string {
  const token = invitationTokenFromPath(path);
  if (!token) return path;
  writePendingInvitation(token);
  return withoutInvitationToken(path);
}

/**
 * Runs once at startup, before the router reads the address: an invitation link (any spelling
 * of `/invitations/accept` or `/accept-invitation`, `?token=`) or a sign-in page whose
 * `return_to` holds one keeps the token for the tab and loses it from the address bar
 * (`history.replaceState`, no new history entry). Returns whether the address changed.
 */
export function captureInvitationFromAddressBar(win: Window = window): boolean {
  const { pathname, search, hash } = win.location;
  let next: string | null = null;
  if (isInvitationPath(pathname)) {
    const cleaned = takeInvitationToken(`${pathname}${search}${hash}`);
    if (cleaned !== `${pathname}${search}${hash}`) next = cleaned;
  } else if (normalizePathname(pathname) === '/login' && search) {
    const params = new URLSearchParams(search);
    const back = params.get('return_to');
    if (back) {
      const cleaned = takeInvitationToken(back);
      if (cleaned !== back) {
        params.set('return_to', cleaned);
        next = `/login?${params.toString()}${hash}`;
      }
    }
  }
  if (next === null) return false;
  try {
    win.history.replaceState(win.history.state, '', next);
  } catch {
    return false;
  }
  return true;
}

/** Accept page path, optionally with the token (only for return paths through a sign-in). */
export function acceptInvitationPath(token?: string | null): string {
  return token
    ? `${ACCEPT_INVITATION_PATH}?${new URLSearchParams({ token }).toString()}`
    : ACCEPT_INVITATION_PATH;
}
