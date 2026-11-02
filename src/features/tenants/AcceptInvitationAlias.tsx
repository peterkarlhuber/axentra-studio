import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { takeInvitationToken, withoutInvitationToken } from './invitationLink';

/**
 * Public `/accept-invitation`: the path of Axentra's default invitation link. Keeps the token
 * for the tab and forwards to the accept page without it, replacing the history entry.
 * Signed-out visitors then go through sign-in and come back to the accept page.
 */
export function AcceptInvitationAlias() {
  const { pathname, search, hash } = useLocation();
  // Read once: the token goes to the tab's pending invitation, the accept page finds it there.
  const [target] = useState(() =>
    withoutInvitationToken(takeInvitationToken(`${pathname}${search}${hash}`)),
  );
  return <Navigate to={target} replace />;
}
