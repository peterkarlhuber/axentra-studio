import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, LogIn } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { apiUrl, isSameOriginApi } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import { authApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { safeReturnPath, useSession } from '@/app/auth';
import { useMeta } from '@/app/contexts';
import { CenteredLayout } from '@/components/layout/CenteredLayout';
import { SplashScreen } from '@/components/layout/FullPageMessage';
import { Alert, Button, FormField, Input, buttonClassName } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { describeError } from '@/lib/errors';
import {
  ACCEPT_INVITATION_PATH,
  invitationTokenFromPath,
  markInvitationSentWithSso,
  readPendingInvitation,
  withoutInvitationToken,
  writePendingInvitation,
} from '@/features/tenants/invitationLink';
import { AuthLanguageSwitch } from './AuthLanguageSwitch';
import styles from './auth.module.css';

/** `?login_error=<code>` values the server uses after a failed single sign-on (OIDC) login. */
const SSO_ERRORS = new Set([
  'login_expired',
  'access_denied',
  'provider_unavailable',
  'login_failed',
  'email_not_verified',
  'domain_not_allowed',
  'signup_disabled',
  'account_disabled',
  'rate_limited',
]);

export function LoginPage() {
  const { t } = useTranslation('auth');
  const meta = useMeta();
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const requested = params.get('return_to');
  // A failed single sign-on comes back without `return_to`: an invitation opened in this tab
  // still leads back to its accept page.
  const returnTo = requested
    ? safeReturnPath(requested)
    : readPendingInvitation()
      ? ACCEPT_INVITATION_PATH
      : '/';
  const invitation = returnTo.split('?')[0] === ACCEPT_INVITATION_PATH;
  // The token of an invitation sign-in: from the return path, else the one kept for this tab.
  const linkToken = invitationTokenFromPath(returnTo);
  const invitationToken = invitation ? (linkToken ?? readPendingInvitation()) : null;
  const ssoError = params.get('login_error');
  const prefill = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefill);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    document.title = `${t('login.title')} · ${t('common:app.name')}`;
  }, [t]);

  // A single sign-on returns to the accept page without the token, so keep it for this tab.
  useEffect(() => {
    if (linkToken) writePendingInvitation(linkToken);
  }, [linkToken]);

  if (meta.setup_required) return <Navigate to="/setup" replace />;
  if (session.isPending) return <SplashScreen label={t('common:states.loading')} />;
  if (session.data) return <Navigate to={returnTo} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // The login response is the new browser session, carrying the CSRF token for all
      // following writes. Store it directly: a cached "no session" entry must not survive.
      const next = await authApi.loginPassword({ email: email.trim(), password });
      setCsrfToken(next.csrf_token);
      queryClient.setQueryData(queryKeys.session, next);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      void navigate(returnTo, { replace: true });
    } catch (caught) {
      setError(caught);
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  // OIDC: the API redirects back to `return_to`. With a separate API origin the target must
  // be an absolute Studio URL. An invitation token never goes into `return_to`, which the
  // server stores in plain text with the login state and does not redact in its access log:
  // it goes in the dedicated `invitation` parameter, which the server keeps encrypted and
  // redacts. That parameter also lets an invited address without an account sign up, and the
  // server accepts the invitation right after the sign-in.
  const oidcTarget = withoutInvitationToken(returnTo);
  const oidcReturn = isSameOriginApi() ? oidcTarget : `${window.location.origin}${oidcTarget}`;
  const oidcQuery = `return_to=${encodeURIComponent(oidcReturn)}${
    invitationToken ? `&invitation=${encodeURIComponent(invitationToken)}` : ''
  }`;
  const providers = meta.auth.oidc ?? [];
  const described = error ? describeError(t, error) : null;
  const invalidCredentials =
    isApiError(error) && (error.status === 401 || error.code === 'unauthenticated');

  return (
    <CenteredLayout
      footer={
        <div className={styles.footer}>
          <AuthLanguageSwitch />
          <span>
            {meta.name} {meta.version}
          </span>
        </div>
      }
    >
      <div className={styles.header}>
        <h1 className={styles.title}>{t('login.title')}</h1>
        <p className={styles.subtitle}>{t('login.subtitle')}</p>
      </div>

      {ssoError && !error ? (
        <Alert tone="danger" title={t('login.ssoErrorTitle')}>
          {SSO_ERRORS.has(ssoError)
            ? t(`login.ssoErrors.${ssoError}`)
            : t('login.ssoErrors.unknown', { code: ssoError.slice(0, 64) })}{' '}
          <HelpLink topic="signing-in#sso-errors" />
        </Alert>
      ) : null}

      {invitation && !error ? (
        <Alert tone="info" title={t('login.invitation.title')}>
          {t('login.invitation.body')}{' '}
          {providers.length === 0
            ? t('login.invitation.confirmNextPage')
            : meta.auth.password
              ? t('login.invitation.confirmOrSso')
              : t('login.invitation.acceptedAtSso')}{' '}
          {providers.length > 0
            ? t('login.invitation.noAccountSso')
            : t('login.invitation.noAccountPassword')}{' '}
          <HelpLink topic="members-invitations#accept" />
        </Alert>
      ) : requested && !error && !ssoError ? (
        <Alert tone="info">{t('login.sessionEnded')}</Alert>
      ) : null}

      {meta.auth.password ? (
        <form className={styles.form} onSubmit={submit} noValidate={false}>
          {described ? (
            <Alert
              tone="danger"
              title={invalidCredentials ? t('login.invalidTitle') : described.title}
            >
              {invalidCredentials ? t('login.invalidBody') : described.message}
              {described.requestId ? (
                <>
                  {' '}
                  ({t('errors:requestId')}: <code>{described.requestId}</code>)
                </>
              ) : null}
            </Alert>
          ) : null}
          <FormField label={t('fields.email')} required>
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <FormField label={t('fields.password')} required>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            icon={<LogIn />}
          >
            {t('login.submit')}
          </Button>
        </form>
      ) : null}

      {providers.length > 0 ? (
        <>
          {meta.auth.password ? <p className={styles.divider}>{t('login.or')}</p> : null}
          <div className={styles.providers}>
            {providers.map((provider) => (
              <a
                key={provider.id}
                className={buttonClassName({ variant: 'secondary', size: 'lg', fullWidth: true })}
                href={apiUrl(`/v1/auth/oidc/${encodeURIComponent(provider.id)}/start?${oidcQuery}`)}
                onClick={invitationToken ? markInvitationSentWithSso : undefined}
              >
                <KeyRound aria-hidden width={16} height={16} />
                {t('login.continueWith', { provider: provider.name })}
              </a>
            ))}
          </div>
        </>
      ) : null}

      {!meta.auth.password && providers.length === 0 ? (
        <Alert tone="warning" title={t('login.noMethodsTitle')}>
          {t('login.noMethodsBody')} <HelpLink topic="signing-in#troubleshooting" />
        </Alert>
      ) : null}

      <p className={styles.helpRow}>
        <HelpLink topic="signing-in">{t('login.help')}</HelpLink>
        <span aria-hidden="true"> · </span>
        <Link to="/help">{t('helpCenter')}</Link>
      </p>
    </CenteredLayout>
  );
}
