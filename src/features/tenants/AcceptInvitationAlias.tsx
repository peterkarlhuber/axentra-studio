import { Navigate, useLocation } from 'react-router';
import { ACCEPT_INVITATION_PATH } from './invitationLink';

/**
 * Public `/accept-invitation`: the path of Axentra's default invitation link. Forwards to the
 * accept page with the same query (the token), replacing the history entry. Signed-out
 * visitors then go through sign-in and come back to the accept page.
 */
export function AcceptInvitationAlias() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: ACCEPT_INVITATION_PATH, search, hash }} replace />;
}
