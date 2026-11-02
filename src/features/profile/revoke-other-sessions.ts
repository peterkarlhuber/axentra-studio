import { authApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import type { UserSession } from '@/api/models';

export interface RevokeOthersResult {
  /** Other sessions that are signed out now (including ones that had already ended). */
  revoked: number;
  /** Other sessions the server did not sign out; `errors` holds the reasons. */
  failed: number;
  errors: unknown[];
}

/** Concurrent `DELETE` requests at most, so a long list does not trip the rate limit at once. */
const CONCURRENCY = 4;

/**
 * Signs out every session of the caller except the current one, one `DELETE
 * /v1/auth/sessions/{id}` per session. Axentra has no "revoke all but this one" endpoint for the
 * caller (the admin endpoint `POST /v1/users/{id}/sessions/revoke` would also end the current
 * session); a user has only a handful of sessions, so one request each is fine and keeps one
 * audit event per session.
 *
 * - The list is read fresh from the server, and only sessions the server does not mark as
 *   `current` are revoked. Without a `current` marker nothing is revoked: the current session is
 *   never at risk.
 * - Each request is independent: a failure does not stop the others and is counted.
 * - `404` means the session had already ended (expired or revoked elsewhere): counted as done.
 */
export async function revokeOtherSessions(
  list: () => Promise<UserSession[]> = authApi.sessions,
  revoke: (sessionId: string) => Promise<unknown> = authApi.revokeSession,
): Promise<RevokeOthersResult> {
  const sessions = await list();
  if (!sessions.some((session) => session.current)) {
    throw new Error('the current session is not in the session list; nothing was revoked');
  }
  const others = sessions.filter((session) => !session.current);
  const result: RevokeOthersResult = { revoked: 0, failed: 0, errors: [] };
  let next = 0;
  const worker = async () => {
    while (next < others.length) {
      const session = others[next++];
      if (!session) break;
      try {
        await revoke(session.id);
        result.revoked += 1;
      } catch (error) {
        if (isApiError(error) && error.isNotFound) {
          result.revoked += 1;
        } else {
          result.failed += 1;
          result.errors.push(error);
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, others.length) }, worker));
  return result;
}
