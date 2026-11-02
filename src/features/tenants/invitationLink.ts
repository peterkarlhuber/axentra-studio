/**
 * Invitation links. Axentra's default link is `<public_url>/accept-invitation?token=...`;
 * Studio's accept page is `/invitations/accept`. The public alias forwards the first to the
 * second (see `AcceptInvitationAlias`), so links already sent keep working.
 *
 * The token is a credential: it is never logged, it leaves the address bar as soon as the
 * accept page has read it, and it is kept for the rest of the tab's session only (so it
 * survives a sign-in, also a single sign-on round trip or an expired session).
 */
export const ACCEPT_INVITATION_PATH = '/invitations/accept';
/** Path of the link Axentra generates by default (`notify.invitation_accept_url` unset). */
export const LEGACY_ACCEPT_INVITATION_PATH = '/accept-invitation';

const STORAGE_KEY = 'axentra.studio.pendingInvitation';
const SSO_KEY = 'axentra.studio.invitationSentWithSso';
/**
 * Query parameter Axentra adds to `return_to` after a single sign-on that accepted the
 * invitation given on start (`invitation_accepted=<tenant id>`).
 */
export const INVITATION_ACCEPTED_PARAM = 'invitation_accepted';

/** The token kept for this tab, or null (storage can be unavailable). */
export function readPendingInvitation(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writePendingInvitation(token: string | null): void {
  try {
    if (token) window.sessionStorage.setItem(STORAGE_KEY, token);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: the token lives only in the page state.
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

/** The invitation token in a Studio return path that leads to the accept page, if any. */
export function invitationTokenFromPath(path: string): string | null {
  const [pathname, query = ''] = (path.split('#')[0] ?? '').split('?');
  if (pathname !== ACCEPT_INVITATION_PATH) return null;
  const token = new URLSearchParams(query).get('token');
  return token?.trim() ? token.trim() : null;
}

/**
 * A Studio return path without the invitation token (the accept page path keeps its other
 * query parameters and hash). Used where the path leaves the browser, such as `return_to` of a
 * single sign-on start, which the server stores and proxies may log.
 */
export function withoutInvitationToken(path: string): string {
  if (invitationTokenFromPath(path) === null) return path;
  const hashAt = path.indexOf('#');
  const beforeHash = hashAt === -1 ? path : path.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : path.slice(hashAt);
  const query = new URLSearchParams(beforeHash.split('?')[1] ?? '');
  query.delete('token');
  const search = query.toString();
  return `${ACCEPT_INVITATION_PATH}${search ? `?${search}` : ''}${hash}`;
}

/** Accept page path, optionally with the token (only for return paths through a sign-in). */
export function acceptInvitationPath(token?: string | null): string {
  return token
    ? `${ACCEPT_INVITATION_PATH}?${new URLSearchParams({ token }).toString()}`
    : ACCEPT_INVITATION_PATH;
}
