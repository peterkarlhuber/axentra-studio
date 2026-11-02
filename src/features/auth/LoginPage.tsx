import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, LogIn } from 'lucide-react';
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
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
import { browserNavigation, isNavigableUrl } from '@/lib/browser';
import {
  ACCEPT_INVITATION_PATH,
  clearInvitationSentWithSso,
  invitationTokenFromPath,
  isInvitationPath,
  markInvitationSentWithSso,
  readPendingInvitation,
  ssoReturnPath,
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
  // An invitation on the `GET` start (refused since security review round 4, R4-1). Studio sends
  // invitations with the `POST` start only; another client or an old link may still hit it.
  'invitation_requires_post',
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
  const invitation = isInvitationPath(returnTo.split(/[?#]/)[0] ?? '');
  // The token of an invitation sign-in: from the return path (only when the sign-in page was
  // reached with one, see the effect below), else the one kept for this tab.
  const linkToken = invitationTokenFromPath(returnTo);
  const invitationToken = invitation ? (linkToken ?? readPendingInvitation()) : null;
  const loginError = params.get('login_error');
  const prefill = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefill);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ssoStarting, setSsoStarting] = useState<string | null>(null);
  const [ssoError, setSsoError] = useState<unknown>(null);

  useEffect(() => {
    document.title = `${t('login.title')} · ${t('common:app.name')}`;
  }, [t]);

  // A token in `return_to` (an address typed or bookmarked before Studio moved tokens out of
  // it) is kept for this tab and leaves the address bar at once (history replace): it must
  // not stay in the history or reach a request's `Referer`.
  useEffect(() => {
    if (!linkToken || !requested) return;
    writePendingInvitation(linkToken);
    const rest = new URLSearchParams(location.search);
    rest.set('return_to', withoutInvitationToken(returnTo));
    void navigate(
      { pathname: location.pathname, search: `?${rest.toString()}`, hash: location.hash },
      { replace: true, state: location.state },
    );
  }, [linkToken, requested, returnTo, location, navigate]);

  // Back from the identity provider through the back/forward cache: the buttons work again.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setSsoStarting(null);
    };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

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
  // be an absolute Studio URL. An invitation token is never in a URL: not in `return_to`
  // (stored in plain text with the login state) and not in the start URL's query (recorded by
  // proxies that log full URLs). With an invitation, Studio starts the sign-on with
  // `POST /v1/auth/oidc/{provider}/start` and the token in the JSON body; the server keeps it
  // encrypted, lets an invited address without an account sign up and accepts the invitation
  // right after the sign-in. Without one, the plain `GET` start link is used, as always.
  const oidcTarget = ssoReturnPath(returnTo);
  const oidcReturn = isSameOriginApi() ? oidcTarget : `${window.location.origin}${oidcTarget}`;
  const oidcQuery = `return_to=${encodeURIComponent(oidcReturn)}`;
  const startUrl = (providerId: string) =>
    apiUrl(`/v1/auth/oidc/${encodeURIComponent(providerId)}/start?${oidcQuery}`);

  const startWithInvitation = async (event: MouseEvent<HTMLAnchorElement>, providerId: string) => {
    if (!invitationToken) return;
    event.preventDefault();
    if (ssoStarting) return;
    setSsoStarting(providerId);
    setSsoError(null);
    markInvitationSentWithSso();
    try {
      const { redirect_url: target } = await authApi.oidcStart(providerId, {
        return_to: oidcReturn,
        invitation: invitationToken,
      });
      if (!isNavigableUrl(target)) throw new Error('unexpected single sign-on redirect');
      browserNavigation.assign(target);
    } catch (caught) {
      clearInvitationSentWithSso();
      setSsoStarting(null);
      if (isApiError(caught) && caught.status === 405) {
        // An Axentra without the POST start: sign on without the invitation; the token stays
        // with this tab and the accept page asks for the confirmation afterwards.
        browserNavigation.assign(startUrl(providerId));
        return;
      }
      setSsoError(caught);
    }
  };
  const providers = meta.auth.oidc ?? [];
  const described = error ? describeError(t, error) : null;
  const ssoDescribed = ssoError ? describeError(t, ssoError) : null;
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

      {loginError && !error ? (
        <Alert tone="danger" title={t('login.ssoErrorTitle')}>
          {SSO_ERRORS.has(loginError)
            ? t(`login.ssoErrors.${loginError}`)
            : t('login.ssoErrors.unknown', { code: loginError.slice(0, 64) })}{' '}
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
      ) : requested && !error && !loginError ? (
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
          {ssoDescribed ? (
            <Alert tone="danger" title={ssoDescribed.title}>
              {ssoDescribed.message}
              {ssoDescribed.requestId ? (
                <>
                  {' '}
                  ({t('errors:requestId')}: <code>{ssoDescribed.requestId}</code>)
                </>
              ) : null}
            </Alert>
          ) : null}
          <div className={styles.providers}>
            {providers.map((provider) => (
              <a
                key={provider.id}
                className={buttonClassName({ variant: 'secondary', size: 'lg', fullWidth: true })}
                // Without JavaScript (or for a new tab) the link signs on without the invitation.
                href={startUrl(provider.id)}
                aria-busy={ssoStarting === provider.id || undefined}
                onClick={
                  invitationToken
                    ? (event) => void startWithInvitation(event, provider.id)
                    : undefined
                }
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
