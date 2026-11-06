import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { invitationsApi, meApi } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import type { Me, ProductMember, TenantMember } from '@/api/models';
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
  PRODUCT_INVITATION_ACCEPTED_PARAM,
  acceptInvitationPath,
  isProductInvitationToken,
  clearInvitationSentWithSso,
  invitationSentWithSso,
  invitationTokenFromPath,
  readPendingInvitation,
  withoutInvitationToken,
  writePendingInvitation,
} from './invitationLink';

interface Accepted {
  productId: string;
  /** Unset for a product team invitation. */
  tenantId?: string;
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

/** Product name of a new product team membership, from the refreshed `/v1/me`. */
function describeProductMembership(me: Me | undefined, membership: ProductMember): Accepted {
  const product = me?.products.find((entry) => entry.product.id === membership.product_id);
  return {
    productId: membership.product_id,
    role: membership.role,
    productName: product?.product.name,
  };
}

/** The product role `/v1/me` lists for `productId`, if the user is on that product's team. */
function productMembershipOf(me: Me, productId: string): Accepted | null {
  const product = me.products.find((entry) => entry.product.id === productId);
  if (!product?.role) return null;
  return { productId, role: product.role, productName: product.product.name };
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

type Outcome =
  'invalid' | 'wrongEmail' | 'noEmail' | 'inactive' | 'inviterLost' | 'unreachable' | 'other';

/**
 * The server refuses an acceptance with one `forbidden` code and a `reason`: `email_mismatch`,
 * `scope_inactive` or `inviter_lost_access`. Older servers send no `reason`; then only the
 * detail tells them apart ("this invitation was sent to another email address", "... is not
 * active", "... no longer valid ..."). A 403 Studio does not recognize shows the server's own
 * message.
 */
function forbiddenOutcome(reason: string | undefined, detail: string, hasEmail: boolean): Outcome {
  if (reason === 'scope_inactive') return 'inactive';
  if (reason === 'inviter_lost_access') return 'inviterLost';
  if (reason === 'email_mismatch') return hasEmail ? 'wrongEmail' : 'noEmail';
  if (reason) return 'other';
  const text = detail.toLowerCase();
  if (text.includes('not active')) return 'inactive';
  if (text.includes('no longer')) return 'inviterLost';
  if (!hasEmail) return 'noEmail';
  if (!text || text.includes('email')) return 'wrongEmail';
  return 'other';
}

function outcomeOf(error: unknown, hasEmail: boolean): Outcome {
  const apiError = toApiError(error);
  // The server answers one 404 for unknown, expired, revoked and used tokens (no oracle).
  if (apiError.isNotFound) return 'invalid';
  if (apiError.isForbidden) {
    return forbiddenOutcome(apiError.reason, apiError.detail ?? '', hasEmail);
  }
  if (apiError.status === 0 || apiError.status >= 500 || apiError.status === 429) {
    return 'unreachable';
  }
  return 'other';
}

/**
 * `POST /v1/invitations/accept` (tenant, `axinv_` tokens) or `POST /v1/product-invitations/accept`
 * (product team, `axpinv_` tokens) for the signed-in user. The token comes from the link
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
  const productAcceptedParam = query.get(PRODUCT_INVITATION_ACCEPTED_PARAM)?.trim() || null;
  const [ssoTarget] = useState<{ kind: 'tenant' | 'product'; id: string } | null>(() => {
    if (!invitationSentWithSso()) return null;
    if (acceptedParam) return { kind: 'tenant', id: acceptedParam };
    if (productAcceptedParam) return { kind: 'product', id: productAcceptedParam };
    return null;
  });
  const ssoAccepted = useMemo(() => {
    if (!ssoTarget || !me.data) return null;
    return ssoTarget.kind === 'tenant'
      ? membershipOf(me.data, ssoTarget.id)
      : productMembershipOf(me.data, ssoTarget.id);
  }, [ssoTarget, me.data]);
  const ssoPending = Boolean(ssoTarget) && me.isPending;
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
    if (!fromUrl && !acceptedParam && !productAcceptedParam) return;
    if (fromUrl) writePendingInvitation(fromUrl);
    const cleaned = withoutInvitationToken(`${location.pathname}${location.search}`);
    const rest = new URLSearchParams(cleaned.split('?')[1] ?? '');
    rest.delete(INVITATION_ACCEPTED_PARAM);
    rest.delete(PRODUCT_INVITATION_ACCEPTED_PARAM);
    const search = rest.toString();
    void navigate(
      { pathname: ACCEPT_INVITATION_PATH, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true },
    );
  }, [
    fromUrl,
    acceptedParam,
    productAcceptedParam,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

  // The single sign-on outcome is settled once `/v1/me` is known: a confirmed membership ends
  // the invitation for this tab; otherwise the page asks for the confirmation as usual.
  useEffect(() => {
    if (!ssoTarget || me.isPending) return;
    clearInvitationSentWithSso();
    if (ssoAccepted) writePendingInvitation(null);
  }, [ssoTarget, me.isPending, ssoAccepted]);

  const accept = useMutation({
    mutationFn: async (): Promise<Accepted> => {
      const value = token.trim();
      const refresh = async () => {
        writePendingInvitation(null);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.me }),
          queryClient.invalidateQueries({ queryKey: queryKeys.products() }),
        ]);
        return queryClient.fetchQuery({ queryKey: queryKeys.me, queryFn: meApi.get });
      };
      if (isProductInvitationToken(value)) {
        const membership = await invitationsApi.acceptProduct(value);
        return describeProductMembership(await refresh(), membership);
      }
      const membership = await invitationsApi.accept(value);
      return describeMembership(await refresh(), membership);
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
  // The refusal texts name the tenant or the product team the token is for.
  const forProduct = isProductInvitationToken(token.trim());

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
    const productPath = `/p/${encodeURIComponent(productId)}`;
    const target = tenantId
      ? `${productPath}/tenants/${encodeURIComponent(tenantId)}`
      : productPath;
    return (
      <div className={layout.stack}>
        <PageHeader title={t('accept.title')} help="members-invitations#accept" />
        <Card>
          <EmptyState
            icon={<CheckCircle2 />}
            title={t('accept.successTitle')}
            description={
              !tenantId
                ? t('accept.successBodyProduct', { product: productName ?? productId, role })
                : tenantName
                  ? t('accept.successBodyNamed', {
                      tenant: tenantName,
                      product: productName ?? productId,
                      role,
                    })
                  : t('accept.successBody', { role })
            }
            action={
              <div className={layout.actions}>
                <ButtonLink to={target} variant="primary">
                  {tenantId ? t('accept.openTenant') : t('accept.openProduct')}
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
            <Alert
              tone="danger"
              title={
                outcome === 'inactive' && forProduct
                  ? t('accept.outcomes.inactive.titleProduct')
                  : t(`accept.outcomes.${outcome}.title`)
              }
            >
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
              ) : outcome === 'inactive' ? (
                <p>
                  {forProduct
                    ? t('accept.outcomes.inactive.bodyProduct')
                    : t('accept.outcomes.inactive.body')}
                </p>
              ) : outcome === 'inviterLost' ? (
                <p>
                  {forProduct
                    ? t('accept.outcomes.inviterLost.bodyProduct')
                    : t('accept.outcomes.inviterLost.body')}
                </p>
              ) : outcome === 'unreachable' ? (
                <p>{t('accept.outcomes.unreachable.body')}</p>
              ) : (
                <>
                  <p>{described.message}</p>
                  {described.error.detail ? (
                    <p>
                      {t('errors:serverMessage')}: {described.error.detail}
                    </p>
                  ) : null}
                </>
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
