import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { setCsrfToken } from '@/api/csrf';
import { authApi, meApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import type { AuthSession } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useToast } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useOptionalProductScope } from './contexts';
import { canAccess, isPlatformAdmin, productAccess } from './permissions';

/** Current browser session, or null when signed out. Keeps the CSRF token in sync. */
export async function fetchSession(): Promise<AuthSession | null> {
  try {
    const session = await authApi.session();
    setCsrfToken(session.csrf_token);
    return session;
  } catch (error) {
    if (isApiError(error) && error.isUnauthenticated) {
      setCsrfToken(null);
      return null;
    }
    throw error;
  }
}

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: fetchSession,
    staleTime: 5 * 60_000,
    retry: (count, error) => !(isApiError(error) && error.status > 0) && count < 2,
  });
}

export function useMe() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: meApi.get,
    enabled: Boolean(session.data),
    staleTime: 60_000,
  });
}

/** Path + query of the current location, used as `return_to`. */
export function currentReturnPath(): string {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

/** Only allow same-app relative paths as redirect targets (no open redirects). */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/';
  }
  if (value.startsWith('/login') || value.startsWith('/setup')) return '/';
  return value;
}

export function loginPath(returnTo?: string): string {
  const target = safeReturnPath(returnTo);
  return target === '/' ? '/login' : `/login?return_to=${encodeURIComponent(target)}`;
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch (error) {
        // An already expired session is a successful logout from the user's perspective.
        if (!(isApiError(error) && error.isUnauthenticated)) throw error;
      }
    },
    onSuccess: () => {
      setCsrfToken(null);
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'meta' && query.queryKey[1] !== 'session',
      });
      void navigate('/login', { replace: true });
    },
  });
}

/**
 * Ends the session and opens the sign-in page with a return path, for actions the server
 * allows only shortly after a sign-in (`403 reauthentication_required`).
 */
export function useReauthenticate() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (returnTo: string) => {
      try {
        await authApi.logout();
      } catch (error) {
        if (!(isApiError(error) && error.isUnauthenticated)) throw error;
      }
      return returnTo;
    },
    onSuccess: (returnTo) => {
      setCsrfToken(null);
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'meta' && query.queryKey[1] !== 'session',
      });
      void navigate(loginPath(returnTo), { replace: true });
    },
  });
}

export interface PermissionScope {
  /** Defaults to the product of the current `/p/:productId` route. */
  productId?: string;
  /** Also consider tenant roles of this tenant. */
  tenantId?: string;
}

/** Permission check for the current product scope (or an explicit product/tenant). */
export function useCan() {
  const { data: me } = useMe();
  const scope = useOptionalProductScope();
  return useCallback(
    (permission: string, target: PermissionScope = {}) => {
      const id = target.productId ?? scope?.productId;
      return canAccess(me, permission, productAccess(me, id), target.tenantId);
    },
    [me, scope],
  );
}

export function useIsPlatformAdmin(): boolean {
  const { data: me } = useMe();
  return isPlatformAdmin(me);
}

/**
 * Report a failed mutation as a translated toast. 403 gets the dedicated "not permitted"
 * message; the request id is attached for support.
 */
export function useErrorToast() {
  const { t } = useTranslation();
  const toast = useToast();
  return useCallback(
    (error: unknown) => {
      const described = describeError(t, error);
      if (described.error.isUnauthenticated) return; // handled by the global redirect
      // For refusals and conflicts the server's explanation (e.g. which permission of a role
      // the caller lacks) is added after the translated message.
      const serverDetail = described.error.detail;
      const explain =
        (described.error.isForbidden || described.error.status === 409) &&
        serverDetail &&
        serverDetail !== described.message;
      const detail = described.issues.length
        ? described.issues.map((issue) => `${issue.field}: ${issue.message}`).join('; ')
        : explain
          ? `${described.message} ${t('errors:serverMessage')}: ${serverDetail}`
          : described.message;
      toast.error(
        described.title,
        detail,
        described.requestId ? `${t('errors:requestId')}: ${described.requestId}` : undefined,
      );
    },
    [t, toast],
  );
}
