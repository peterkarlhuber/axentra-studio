import { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router';

/** Route `handle` used for breadcrumbs: an i18n key, or a route param shown verbatim. */
export interface RouteHandle {
  crumb?: string;
  crumbParam?: string;
}

export interface CrumbStore {
  labels: Record<string, string>;
  setLabel: (pathname: string, label: string | undefined) => void;
}

export const CrumbContext = createContext<CrumbStore | null>(null);

/** Detail pages replace the raw id in the breadcrumb with a human name once loaded. */
export function useCrumbLabel(label: string | undefined) {
  const store = useContext(CrumbContext);
  const { pathname } = useLocation();
  const setLabel = store?.setLabel;
  useEffect(() => {
    if (!setLabel) return;
    setLabel(pathname, label);
    return () => setLabel(pathname, undefined);
  }, [setLabel, pathname, label]);
}
