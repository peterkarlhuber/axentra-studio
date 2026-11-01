import { useQuery } from '@tanstack/react-query';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { usePreferences } from '@/app/preferences';
import {
  Card,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  Select,
  Skeleton,
  layout,
} from '@/components/ui';
import { isLocale } from '@/i18n';
import { THEME_PREFERENCES, isThemePreference } from '@/lib/theme';
import { SettingsTree } from './SettingsTree';
import styles from './settings.module.css';

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };

export function SettingsPage() {
  const { t } = useTranslation('settings');
  const { locale, theme, setLanguage, setTheme, saving } = usePreferences();
  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
    retry: false,
  });

  return (
    <div className={layout.stack}>
      <PageHeader title={t('title')} description={t('description')} />
      <Card title={t('preferences.title')} description={t('preferences.description')}>
        <div className={layout.form}>
          <FormField label={t('preferences.language')} help={t('preferences.languageHelp')}>
            <Select
              value={locale}
              onChange={(event) =>
                isLocale(event.target.value) ? setLanguage(event.target.value) : undefined
              }
            >
              <option value="de" lang="de">
                Deutsch
              </option>
              <option value="en" lang="en">
                English
              </option>
            </Select>
          </FormField>
          <fieldset className={styles.themes}>
            <legend className={styles.legend}>{t('preferences.theme')}</legend>
            {THEME_PREFERENCES.map((option) => {
              const Icon = THEME_ICONS[option];
              return (
                <label
                  key={option}
                  className={styles.theme}
                  data-checked={theme === option || undefined}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={option}
                    checked={theme === option}
                    onChange={(event) =>
                      isThemePreference(event.target.value)
                        ? setTheme(event.target.value)
                        : undefined
                    }
                    className={styles.radio}
                  />
                  <span className={styles.swatch} data-theme-swatch={option} aria-hidden="true" />
                  <span className={styles.themeLabel}>
                    <Icon aria-hidden width={16} height={16} /> {t(`common:theme.${option}`)}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <p className={layout.muted} aria-live="polite">
            {saving ? t('preferences.saving') : t('preferences.storedHint')}
          </p>
        </div>
      </Card>
      <Card title={t('server.title')} description={t('server.description')}>
        {settings.isPending ? (
          <div className={layout.form} aria-busy="true">
            <Skeleton />
            <Skeleton width="70%" />
            <Skeleton width="50%" />
          </div>
        ) : settings.isError ? (
          <ErrorState
            error={settings.error}
            onRetry={() => void settings.refetch()}
            compact
            headingLevel={3}
          />
        ) : Object.keys(settings.data).length === 0 ? (
          <EmptyState compact headingLevel={3} title={t('server.empty')} />
        ) : (
          <SettingsTree value={settings.data} label={t('server.title')} />
        )}
      </Card>
    </div>
  );
}
