import { ArrowLeft, LogIn } from 'lucide-react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router';
import { SplashScreen } from '@/components/layout/FullPageMessage';
import { Logo } from '@/components/layout/Logo';
import { loginPath, useSession } from '@/app/auth';
import { MetaContext } from '@/app/contexts';
import { AppShell } from '@/app/shell/AppShell';
import { LOCALE_NAMES, SUPPORTED_LOCALES, isLocale, setLocale } from '@/i18n';
import styles from './help.module.css';

/**
 * The help center is public: signed-in users read it inside the Studio shell, everyone else
 * (for example on the sign-in or setup screen) gets a slim header with language and sign-in.
 */
export function HelpLayout() {
  const { t } = useTranslation();
  const meta = useContext(MetaContext);
  const session = useSession();
  // Without server metadata (server unreachable or incompatible) only the public layout works.
  if (!meta) return <PublicHelpLayout />;
  if (session.isPending) return <SplashScreen label={t('states.loading')} />;
  if (session.data) return <AppShell />;
  return <PublicHelpLayout />;
}

function PublicHelpLayout() {
  const { t, i18n } = useTranslation();
  const { pathname, hash } = useLocation();
  return (
    <div className={styles.publicPage}>
      <a href="#main-content" className="ax-skip-link">
        {t('nav:skipToContent')}
      </a>
      <header className={styles.publicHeader}>
        <Link to="/help" className={styles.publicBrand}>
          <Logo height={36} alt={t('app.name')} />
        </Link>
        <div className={styles.publicActions}>
          <label className={styles.publicLanguage}>
            <span className="ax-sr-only">{t('userMenu.language')}</span>
            <select
              value={isLocale(i18n.language) ? i18n.language : 'en'}
              onChange={(event) =>
                isLocale(event.target.value) ? void setLocale(event.target.value) : undefined
              }
            >
              {SUPPORTED_LOCALES.map((lng) => (
                <option key={lng} value={lng} lang={lng}>
                  {LOCALE_NAMES[lng]}
                </option>
              ))}
            </select>
          </label>
          <Link className={styles.publicSignIn} to={loginPath(pathname + hash)}>
            <LogIn aria-hidden="true" />
            {t('help:center.signIn')}
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className={styles.publicMain}>
        <Outlet />
      </main>
      <footer className={styles.publicFooter}>
        <Link to="/login">
          <ArrowLeft aria-hidden="true" />
          {t('help:center.backToStudio')}
        </Link>
      </footer>
    </div>
  );
}
