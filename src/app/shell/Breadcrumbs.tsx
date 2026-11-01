import { ChevronRight } from 'lucide-react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useMatches } from 'react-router';
import { CrumbContext, type RouteHandle } from '../crumbs';
import styles from './Breadcrumbs.module.css';

export function Breadcrumbs() {
  const { t } = useTranslation('nav');
  const matches = useMatches();
  const store = useContext(CrumbContext);

  const crumbs = matches
    .filter((match) => {
      const handle = match.handle as RouteHandle | undefined;
      return handle?.crumb || handle?.crumbParam;
    })
    .map((match) => {
      const handle = match.handle as RouteHandle;
      const override = store?.labels[match.pathname];
      const label =
        override ??
        (handle.crumbParam ? (match.params[handle.crumbParam] ?? '') : t(handle.crumb ?? ''));
      return { id: match.id, label, to: match.pathname };
    });

  // Deduplicate consecutive crumbs pointing to the same path (index routes).
  const unique = crumbs.filter((crumb, index) => crumbs[index - 1]?.to !== crumb.to);
  if (unique.length === 0) return null;

  return (
    <nav aria-label={t('breadcrumb')} className={styles.nav}>
      <ol className={styles.list}>
        {unique.map((crumb, index) => {
          const last = index === unique.length - 1;
          return (
            <li key={crumb.id} className={styles.item}>
              {index > 0 ? <ChevronRight aria-hidden className={styles.separator} /> : null}
              {last ? (
                <span aria-current="page" className={styles.current}>
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className={styles.link}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
