import { useTranslation } from 'react-i18next';
import { isLocale, setLocale } from '@/i18n';
import styles from './auth.module.css';

/** Language toggle for pre-login screens (no user menu there). */
export function AuthLanguageSwitch() {
  const { t, i18n } = useTranslation();
  return (
    <div className={styles.language} role="group" aria-label={t('userMenu.language')}>
      {(['de', 'en'] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          lang={lng}
          aria-pressed={i18n.language === lng}
          className={styles.languageButton}
          onClick={() => (isLocale(lng) ? void setLocale(lng) : undefined)}
        >
          {lng === 'de' ? 'Deutsch' : 'English'}
        </button>
      ))}
    </div>
  );
}
