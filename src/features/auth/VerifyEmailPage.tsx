import { useQueryClient } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { authApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { useSession } from '@/app/auth';
import { CenteredLayout } from '@/components/layout/CenteredLayout';
import { Alert, Button } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { describeError } from '@/lib/errors';
import { useLinkToken } from './accountLink';
import { AuthLanguageSwitch } from './AuthLanguageSwitch';
import styles from './auth.module.css';

/**
 * `/verify-email?token=...`: the page of an email verification link. Confirms on a click, not on
 * load: mail scanners that open links must not use the link up. Works signed out (the link may
 * be opened in another browser).
 */
export function VerifyEmailPage() {
  const { t } = useTranslation('auth');
  const queryClient = useQueryClient();
  const session = useSession();
  const token = useLinkToken();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    document.title = `${t('verify.title')} · ${t('common:app.name')}`;
  }, [t]);

  const confirm = async () => {
    if (!token) return;
    setState('busy');
    setError(null);
    try {
      await authApi.confirmEmailVerification({ token });
      setState('done');
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    } catch (caught) {
      setError(caught);
      setState('idle');
    }
  };

  const invalidLink = !token || (isApiError(error) && error.code === 'invalid_token');
  const described = error && !invalidLink ? describeError(t, error) : null;
  const signedIn = Boolean(session.data);

  return (
    <CenteredLayout footer={<AuthLanguageSwitch />}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('verify.title')}</h1>
        <p className={styles.subtitle}>{t('verify.subtitle')}</p>
      </div>
      {state === 'done' ? (
        <Alert tone="success" title={t('verify.doneTitle')}>
          {t('verify.doneBody')}
        </Alert>
      ) : invalidLink ? (
        <Alert tone="danger" title={t('verify.invalidTitle')}>
          {t('verify.invalidBody')} <HelpLink topic="profile#email-verification" />
        </Alert>
      ) : (
        <div className={styles.form}>
          {described ? (
            <Alert tone="danger" title={described.title}>
              {described.message}
            </Alert>
          ) : null}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={state === 'busy'}
            icon={<MailCheck />}
            onClick={() => void confirm()}
          >
            {t('verify.submit')}
          </Button>
        </div>
      )}
      <p className={styles.helpRow}>
        <Link to={signedIn ? '/profile' : '/login'}>
          {signedIn ? t('verify.toProfile') : t('forgot.backToLogin')}
        </Link>
      </p>
    </CenteredLayout>
  );
}
