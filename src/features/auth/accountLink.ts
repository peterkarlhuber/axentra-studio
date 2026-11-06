import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * The token of a password reset or email verification link (`?token=...`), read once. It is a
 * credential: the page removes it from the address bar at once (history replace), so it stays
 * neither in the history nor in a bookmark; Studio sends no `Referer` (`no-referrer`).
 */
export function useLinkToken(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(location.search).get('token')?.trim() || null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('token')) return;
    params.delete('token');
    const rest = params.toString();
    void navigate(
      { pathname: location.pathname, search: rest ? `?${rest}` : '', hash: location.hash },
      { replace: true },
    );
  }, [location, navigate]);
  return token;
}
