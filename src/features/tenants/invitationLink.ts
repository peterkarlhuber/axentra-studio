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

/** The invitation token in a Studio return path that leads to the accept page, if any. */
export function invitationTokenFromPath(path: string): string | null {
  const [pathname, query = ''] = (path.split('#')[0] ?? '').split('?');
  if (pathname !== ACCEPT_INVITATION_PATH) return null;
  const token = new URLSearchParams(query).get('token');
  return token?.trim() ? token.trim() : null;
}

/** Accept page path, optionally with the token (only for return paths through a sign-in). */
export function acceptInvitationPath(token?: string | null): string {
  return token
    ? `${ACCEPT_INVITATION_PATH}?${new URLSearchParams({ token }).toString()}`
    : ACCEPT_INVITATION_PATH;
}
