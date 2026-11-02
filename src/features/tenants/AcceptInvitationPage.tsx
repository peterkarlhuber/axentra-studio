import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { invitationsApi, meApi } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import type { Me, TenantMember } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useMe, useReauthenticate, useSession } from '@/app/auth';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Skeleton,
  layout,
} from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { describeError } from '@/lib/errors';
import {
  ACCEPT_INVITATION_PATH,
  INVITATION_ACCEPTED_PARAM,
  acceptInvitationPath,
  clearInvitationSentWithSso,
  invitationSentWithSso,
  invitationTokenFromPath,
  readPendingInvitation,
  withoutInvitationToken,
  writePendingInvitation,
} from './invitationLink';

interface Accepted {
  productId: string;
  tenantId: string;
  role: string;
  tenantName?: string;
  productName?: string;
}

/** Product and tenant names of the new membership, from the refreshed `/v1/me`. */
function describeMembership(me: Me | undefined, membership: TenantMember): Accepted {
  const product = me?.products.find((entry) => entry.product.id === membership.product_id);
  const tenant = product?.tenants.find((entry) => entry.tenant.id === membership.tenant_id);
  return {
    productId: membership.product_id,
    tenantId: membership.tenant_id,
    role: membership.role,
    productName: product?.product.name,
    tenantName: tenant?.tenant.name,
  };
}

/** The membership `/v1/me` lists for `tenantId`, if the user is a member of that tenant. */
function membershipOf(me: Me, tenantId: string): Accepted | null {
  for (const product of me.products) {
    const tenant = product.tenants.find((entry) => entry.tenant.id === tenantId);
    if (tenant?.role) {
      return {
        productId: product.product.id,
        tenantId,
        role: tenant.role,
        productName: product.product.name,
        tenantName: tenant.tenant.name,
      };
    }
  }
  return null;
}

type Outcome = 'invalid' | 'wrongEmail' | 'noEmail' | 'unreachable' | 'other';

function outcomeOf(error: unknown, hasEmail: boolean): Outcome {
  const apiError = toApiError(error);
  // The server answers one 404 for unknown, expired, revoked and used tokens (no oracle).
  if (apiError.isNotFound) return 'invalid';
  if (apiError.isForbidden) return hasEmail ? 'wrongEmail' : 'noEmail';
  if (apiError.status === 0 || apiError.status >= 500 || apiError.status === 429) {
    return 'unreachable';
  }
  return 'other';
}

/**
 * `POST /v1/invitations/accept` for the signed-in user. The token comes from the link
 * (`?token=`, usually taken out of the address bar at startup already, see
 * `captureInvitationFromAddressBar`), from the tab's pending invitation or is pasted. A token
 * still in the address bar is moved out of it at once (history replace), so it neither stays in
 * the history nor leaks in a `Referer`; the tab keeps it until the invitation is accepted.
 * Nothing is sent before the user confirms.
 */
export function AcceptInvitationPage() {
  const { t } = useTranslation('tenants');
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const reauthenticate = useReauthenticate();
  const user = session.data?.user;
  const hasEmail = Boolean(user?.email);

  const me = useMe();
  const query = new URLSearchParams(location.search);
  // Any spelling the router accepts (`/INVITATIONS/accept/?TOKEN=`): see invitationLink.ts.
  const fromUrl = invitationTokenFromPath(`${location.pathname}${location.search}`);
  // After a single sign-on that this tab started with the invitation, the server has already
  // accepted it and names the tenant. Trusted only together with that tab marker, and only
  // once `/v1/me` confirms the membership: no second confirmation that would fail.
  const acceptedParam = query.get(INVITATION_ACCEPTED_PARAM)?.trim() || null;
  const [ssoTenant] = useState(() =>
    acceptedParam && invitationSentWithSso() ? acceptedParam : null,
  );
  const ssoAccepted = useMemo(
    () => (ssoTenant && me.data ? membershipOf(me.data, ssoTenant) : null),
    [ssoTenant, me.data],
  );
  const ssoPending = Boolean(ssoTenant) && me.isPending;
  const [token, setToken] = useState(() => fromUrl ?? readPendingInvitation() ?? '');
  const [fromLink, setFromLink] = useState(() => Boolean(fromUrl ?? readPendingInvitation()));

  // A link opened while the page is shown (another invitation) replaces the token.
  const [seenUrlToken, setSeenUrlToken] = useState(fromUrl);
  if (fromUrl && fromUrl !== seenUrlToken) {
    setSeenUrlToken(fromUrl);
    setToken(fromUrl);
    setFromLink(true);
  }

  useEffect(() => {
    if (!fromUrl && !acceptedParam) return;
    if (fromUrl) writePendingInvitation(fromUrl);
    const cleaned = withoutInvitationToken(`${location.pathname}${location.search}`);
    const rest = new URLSearchParams(cleaned.split('?')[1] ?? '');
    rest.delete(INVITATION_ACCEPTED_PARAM);
    const search = rest.toString();
    void navigate(
      { pathname: ACCEPT_INVITATION_PATH, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true },
    );
  }, [fromUrl, acceptedParam, location.pathname, location.search, location.hash, navigate]);

  // The single sign-on outcome is settled once `/v1/me` is known: a confirmed membership ends
  // the invitation for this tab; otherwise the page asks for the confirmation as usual.
  useEffect(() => {
    if (!ssoTenant || me.isPending) return;
    clearInvitationSentWithSso();
    if (ssoAccepted) writePendingInvitation(null);
  }, [ssoTenant, me.isPending, ssoAccepted]);

  const accept = useMutation({
    mutationFn: async (): Promise<Accepted> => {
      const membership = await invitationsApi.accept(token.trim());
      writePendingInvitation(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products() }),
      ]);
      const me = await queryClient.fetchQuery({ queryKey: queryKeys.me, queryFn: meApi.get });
      return describeMembership(me, membership);
    },
    onError: (error) => {
      // A token the server refuses for good is of no further use in this tab.
      if (toApiError(error).isNotFound) writePendingInvitation(null);
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    accept.mutate();
  };
  const switchAccount = () =>
    reauthenticate.mutate(acceptInvitationPath(token.trim() || readPendingInvitation()));

  const outcome = accept.error ? outcomeOf(accept.error, hasEmail) : null;
  const described = accept.error ? describeError(t, accept.error) : null;
  const account = user?.email ?? user?.name ?? '';

  if (ssoPending) {
    return (
      <div className={layout.stack}>
        <PageHeader title={t('accept.title')} help="members-invitations#accept" />
        <Skeleton height={32} width={240} />
      </div>
    );
  }

  const done = accept.data ?? ssoAccepted;
  if (done) {
    const { productId, tenantId, role, tenantName, productName } = done;
    const tenantPath = `/p/${encodeURIComponent(productId)}/tenants/${encodeURIComponent(tenantId)}`;
    return (
      <div className={layout.stack}>
        <PageHeader title={t('accept.title')} help="members-invitations#accept" />
        <Card>
          <EmptyState
            icon={<CheckCircle2 />}
            title={t('accept.successTitle')}
            description={
              tenantName
                ? t('accept.successBodyNamed', {
                    tenant: tenantName,
                    product: productName ?? productId,
                    role,
                  })
                : t('accept.successBody', { role })
            }
            action={
              <div className={layout.actions}>
                <ButtonLink to={tenantPath} variant="primary">
                  {t('accept.openTenant')}
                </ButtonLink>
                <ButtonLink to="/" variant="secondary">
                  {t('accept.continue')}
                </ButtonLink>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('accept.title')}
        description={t('accept.description')}
        help="members-invitations#accept"
      />
      <Card>
        <form className={layout.form} onSubmit={submit}>
          {account ? (
            <p className={layout.muted} data-testid="accept-signed-in-as">
              <Trans
                t={t}
                i18nKey="accept.signedInAs"
                values={{ account }}
                components={{ strong: <strong /> }}
              />{' '}
              <Button
                variant="ghost"
                size="sm"
                icon={<LogOut />}
                loading={reauthenticate.isPending}
                onClick={switchAccount}
              >
                {t('accept.switchAccount')}
              </Button>
            </p>
          ) : null}

          {user && !hasEmail ? (
            <Alert tone="warning" title={t('accept.noEmailTitle')}>
              {t('accept.noEmail')}{' '}
              <HelpLink topic="members-invitations#troubleshooting">
                {t('common:help.learnMore')}
              </HelpLink>
            </Alert>
          ) : null}

          {outcome && described ? (
            <Alert tone="danger" title={t(`accept.outcomes.${outcome}.title`)}>
              {outcome === 'invalid' ? (
                <>
                  <p>{t('accept.outcomes.invalid.body')}</p>
                  <ul>
                    <li>{t('accept.outcomes.invalid.expired')}</li>
                    <li>{t('accept.outcomes.invalid.used')}</li>
                    <li>{t('accept.outcomes.invalid.revoked')}</li>
                    <li>{t('accept.outcomes.invalid.mistyped')}</li>
                  </ul>
                  <p>{t('accept.outcomes.invalid.next')}</p>
                </>
              ) : outcome === 'wrongEmail' ? (
                <p>{t('accept.outcomes.wrongEmail.body', { account })}</p>
              ) : outcome === 'noEmail' ? (
                <p>{t('accept.noEmail')}</p>
              ) : outcome === 'unreachable' ? (
                <p>{t('accept.outcomes.unreachable.body')}</p>
              ) : (
                <p>{described.message}</p>
              )}
              {described.requestId ? (
                <p>
                  {t('errors:requestId')}: <code>{described.requestId}</code>
                </p>
              ) : null}
              <HelpLink topic="members-invitations#troubleshooting">
                {t('common:help.learnMore')}
              </HelpLink>
            </Alert>
          ) : null}

          <FormField
            label={t('accept.token')}
            help={fromLink && token ? t('accept.tokenFromLink') : t('accept.tokenHelp')}
            required
          >
            <Input
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setFromLink(false);
              }}
              spellCheck={false}
              autoComplete="off"
            />
          </FormField>
          <div className={layout.actions}>
            {outcome === 'wrongEmail' ? (
              <Button
                variant="primary"
                icon={<LogOut />}
                loading={reauthenticate.isPending}
                onClick={switchAccount}
              >
                {t('accept.switchAccountAction')}
              </Button>
            ) : outcome === 'unreachable' ? (
              <Button
                type="submit"
                variant="primary"
                icon={<RefreshCw />}
                loading={accept.isPending}
                disabled={!token.trim()}
              >
                {t('common:actions.retry')}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                icon={<MailCheck />}
                loading={accept.isPending}
                disabled={!token.trim() || !hasEmail}
              >
                {t('accept.submit')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
