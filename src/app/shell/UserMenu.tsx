import { Languages, LogOut, Monitor, Moon, Sun, SunMoon, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui';
import { isLocale } from '@/i18n';
import { isThemePreference } from '@/lib/theme';
import { useErrorToast, useLogout, useSession } from '../auth';
import { usePreferences } from '../preferences';
import { initials } from './shell-utils';
import styles from './Topbar.module.css';

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const logout = useLogout();
  const showError = useErrorToast();
  const { locale, theme, setLanguage, setTheme } = usePreferences();
  const user = session?.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={styles.userButton}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(user?.name, user?.email)}
        </span>
        {/* Visible name first, so the accessible name contains the visible label (WCAG 2.5.3). */}
        <span className={styles.userName}>{user?.name || user?.email}</span>
        <span className="ax-sr-only"> {t('userMenu.open')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className={styles.userHeader}>
          <p className={styles.userHeaderName}>{user?.name}</p>
          <p className={styles.userHeaderEmail}>{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<UserRound />} onSelect={() => void navigate('/profile')}>
          {t('userMenu.profile')}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger icon={<Languages />}>
            {t('userMenu.language')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>{t('userMenu.language')}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              label={t('userMenu.language')}
              value={locale}
              onValueChange={(value) => (isLocale(value) ? setLanguage(value) : undefined)}
            >
              <DropdownMenuRadioItem value="de">
                <span lang="de">Deutsch</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="en">
                <span lang="en">English</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger icon={<SunMoon />}>{t('userMenu.theme')}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>{t('userMenu.theme')}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              label={t('userMenu.theme')}
              value={theme}
              onValueChange={(value) => (isThemePreference(value) ? setTheme(value) : undefined)}
            >
              <DropdownMenuRadioItem value="light" icon={<Sun />}>
                {t('theme.light')}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" icon={<Moon />}>
                {t('theme.dark')}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" icon={<Monitor />}>
                {t('theme.system')}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<LogOut />}
          disabled={logout.isPending}
          onSelect={() => logout.mutate(undefined, { onError: showError })}
        >
          {t('userMenu.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
