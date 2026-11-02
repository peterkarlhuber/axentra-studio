import { Languages } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui';
import { isLocale, LOCALE_NAMES, setLocale, SUPPORTED_LOCALES } from '@/i18n';
import styles from './auth.module.css';

/**
 * Language choice for pre-login screens (there is no user menu yet): a compact, labelled
 * native select, so it stays narrow on phones and works with keyboard and screen readers.
 */
export function AuthLanguageSwitch() {
  const { t, i18n } = useTranslation();
  const id = useId();
  const current = isLocale(i18n.language) ? i18n.language : 'en';
  return (
    <div className={styles.language}>
      <label htmlFor={id} className={styles.languageLabel}>
        <Languages aria-hidden width={16} height={16} />
        <span className="ax-sr-only">{t('userMenu.language')}</span>
      </label>
      <Select
        id={id}
        className={styles.languageSelect}
        value={current}
        onChange={(event) => {
          const next = event.target.value;
          if (isLocale(next)) void setLocale(next);
        }}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale} lang={locale}>
            {LOCALE_NAMES[locale]}
          </option>
        ))}
      </Select>
    </div>
  );
}
