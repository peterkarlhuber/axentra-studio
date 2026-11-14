import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { onUnauthenticated } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import { queryKeys } from '@/api/queryKeys';
import { requestRouteFocus } from '@/lib/route-focus';
import { currentReturnPath, loginPath } from './auth';
import { CrumbContext, type CrumbStore } from './crumbs';
import { HelpProvider } from '@/help/HelpProvider';

/** Router root: global 401 handling, focus on navigation, breadcrumb label store. */
export function RootLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const first = useRef(true);
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(
    () =>
      onUnauthenticated(() => {
        const path = currentReturnPath();
        if (path.startsWith('/login') || path.startsWith('/setup')) return;
        setCsrfToken(null);
        queryClient.setQueryData(queryKeys.session, null);
        void navigate(loginPath(path), { replace: true });
      }),
    [navigate, queryClient],
  );

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // A URL fragment names the section to land on; that page focuses it itself.
    if (window.location.hash) return;
    requestRouteFocus();
  }, [pathname]);

  // setLabel must keep its identity: pages pass it to an effect (useCrumbLabel), and a new function on every
  // label change made that effect remove and re-add its label in an endless loop of updates, which kept a
  // navigation away from a detail page from ever finishing (the address changed, the page did not).
  const setLabel = useCallback<CrumbStore['setLabel']>(
    (path, label) =>
      setLabels((current) => {
        if (current[path] === label) return current;
        if (label !== undefined) return { ...current, [path]: label };
        return Object.fromEntries(Object.entries(current).filter(([key]) => key !== path));
      }),
    [],
  );
  const store = useMemo<CrumbStore>(() => ({ labels, setLabel }), [labels, setLabel]);

  return (
    <CrumbContext.Provider value={store}>
      <HelpProvider>
        <Outlet />
      </HelpProvider>
    </CrumbContext.Provider>
  );
}
